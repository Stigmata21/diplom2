import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../../../../lib/db';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function POST(req: NextRequest) {
  try {
    // Проверяем авторизацию пользователя
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const avatarFile = formData.get('avatar') as File;
    
    if (!avatarFile) {
      return NextResponse.json({ error: 'Файл аватара не предоставлен' }, { status: 400 });
    }

    // Проверяем, что файл является изображением
    if (!avatarFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Файл должен быть изображением' }, { status: 400 });
    }

    // Читаем содержимое файла
    const bytes = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Создаем уникальное имя файла
    const uniqueId = uuidv4();
    const extension = path.extname(avatarFile.name).toLowerCase() || '.jpg';
    const fileName = `${uniqueId}${extension}`;
    
    // Папка для сохранения аватаров
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      // Проверяем существование директории, если нет - создаём
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);

    // Сохраняем файл
    await fs.writeFile(filePath, buffer);
    
    // URL для доступа к аватару
    const avatarUrl = `/uploads/${fileName}`;
    
    // Обновляем запись в базе данных
    const users = await query<User>(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [avatarUrl, userId]
    );
    
    const user = users[0];
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      url: avatarUrl,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    return NextResponse.json({ 
      error: 'Ошибка загрузки аватара: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка')
    }, { status: 500 });
  }
} 