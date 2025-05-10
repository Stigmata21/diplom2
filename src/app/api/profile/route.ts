import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import fs from 'fs/promises';

// Типизация для пользовательских данных
interface DbUser {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await query<DbUser>(
      'SELECT id, username, email, role, avatar_url FROM users WHERE id = $1',
      [session.user.id]
    );
    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const updates: Record<string, unknown> = {};
    const email = formData.get('email') as string | null;
    const username = formData.get('username') as string | null;
    const avatarFile = formData.get('avatar') as File | null;

    console.log('PUT /api/profile - Processing request');
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Avatar file:', avatarFile ? `${avatarFile.name} (${avatarFile.size} bytes)` : 'No avatar file');

    // Обрабатываем файл аватара, если он предоставлен
    if (avatarFile) {
      try {
        // Проверяем, что файл является изображением
        if (!avatarFile.type.startsWith('image/')) {
          return NextResponse.json({ 
            error: 'Файл должен быть изображением'
          }, { status: 400 });
        }

        // Проверяем размер файла (максимум 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB в байтах
        if (avatarFile.size > maxSize) {
          return NextResponse.json({ 
            error: 'Размер файла не должен превышать 5MB'
          }, { status: 400 });
        }

        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Извлекаем расширение файла
        const originalFilename = avatarFile.name;
        const fileExtension = originalFilename.includes('.') 
          ? originalFilename.substring(originalFilename.lastIndexOf('.')) 
          : '.jpg';
        
        // Создаем уникальное имя файла с корректным расширением
        const filename = `${uuidv4()}${fileExtension}`;
        const uploadsDir = join(process.cwd(), 'public/uploads');
        
        // Проверяем существование директории, если нет - создаём
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
          console.log('Created uploads directory:', uploadsDir);
        }
        
        const filePath = join(uploadsDir, filename);
        console.log('Saving avatar to:', filePath);
        
        // Сохраняем файл
        await writeFile(filePath, buffer);
        console.log('File saved successfully');
        
        // Строим URL для доступа к аватару
        const avatar_url = `/uploads/${filename}`;
        updates.avatar_url = avatar_url;
        console.log('Avatar URL to save:', avatar_url);
        
        // Проверяем, что файл действительно создан
        try {
          await fs.access(filePath);
          const fileStats = await fs.stat(filePath);
          console.log(`Verified file created: ${filePath}, size: ${fileStats.size} bytes`);
          
          // Если пользователь уже имел аватар, удаляем старый файл
          if (session.user.avatar_url) {
            try {
              const oldFilePath = join(process.cwd(), 'public', session.user.avatar_url);
              await fs.access(oldFilePath);
              await fs.unlink(oldFilePath);
              console.log(`Deleted old avatar: ${oldFilePath}`);
            } catch (oldFileError) {
              // Если не удалось удалить старый файл, просто логируем ошибку
              console.warn('Could not delete old avatar file:', oldFileError);
            }
          }
        } catch (fileAccessError) {
          console.error('File was not created properly:', fileAccessError);
          return NextResponse.json({ 
            error: 'Не удалось сохранить файл аватара'
          }, { status: 500 });
        }
      } catch (fileError) {
        console.error('Error processing avatar file:', fileError);
        return NextResponse.json({ 
          error: 'Ошибка при обработке файла аватара: ' + (fileError instanceof Error ? fileError.message : 'Неизвестная ошибка')
        }, { status: 500 });
      }
    }

    // Добавляем поля email и username только если они предоставлены
    if (email && email.trim()) updates.email = email.trim();
    if (username && username.trim()) updates.username = username.trim();

    // Проверяем, есть ли данные для обновления
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'Нет данных для обновления' }, { status: 200 });
    }

    // Формируем динамический SQL
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(updates) as (string | number | boolean | null)[];
    values.push(session.user.id);

    console.log('SQL update clause:', setClause);
    console.log('Values:', values);

    const result = await query<DbUser>(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING id, username, email, role, avatar_url`,
      values
    );

    if (!result || result.length === 0) {
      console.error('No result returned from database update');
      return NextResponse.json({ error: 'Не удалось обновить профиль' }, { status: 500 });
    }

    console.log('User update result:', result[0]);
    
    // Дополнительная проверка аватара после обновления
    if (updates.avatar_url && result[0]) {
      console.log('Comparing avatar URLs:');
      console.log('  Requested:', updates.avatar_url);
      console.log('  Returned: ', result[0].avatar_url);
      
      // Гарантируем что результат содержит аватар из updates
      result[0].avatar_url = updates.avatar_url as string;
    }
    
    // Добавляем явное возвращение avatar_url как отдельного поля для упрощения клиентской обработки
    return NextResponse.json({ 
      user: result[0],
      avatar_url: result[0].avatar_url,
      success: true,
      message: 'Профиль успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Ошибка обновления профиля: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка')
    }, { status: 500 });
  }
} 