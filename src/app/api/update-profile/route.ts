// src/app/api/update-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import bcrypt from 'bcrypt';

interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    avatar_url?: string;
    company_id?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Входящие данные:', body);
        
        const { userId, username, email, currentPassword, newPassword, avatarUrl } = body;

        // Если это запрос на изменение пароля, проверяем только userId
        if (currentPassword && newPassword) {
            if (!userId) {
                console.error('Не указан ID пользователя для смены пароля');
                return NextResponse.json({ error: 'Не указан ID пользователя' }, { status: 400 });
            }
        } else {
            // Для обычного обновления профиля проверяем все поля
        if (!userId || !username || !email) {
                console.error('Не все обязательные поля заполнены:', { userId, username, email });
            return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
            }
        }

        const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
        console.log('Найдено пользователей:', users.length);
        
        const user = users[0];

        if (!user) {
            console.error('Пользователь не найден, ID:', userId);
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        if (currentPassword && !(await bcrypt.compare(currentPassword, user.password_hash))) {
            console.error('Неверный текущий пароль для пользователя:', userId);
            return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
        }

        let passwordHash = user.password_hash;
        if (newPassword) {
            console.log('Хеширование нового пароля для пользователя:', userId);
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(newPassword, saltRounds);
        }
        
        // Используем существующие значения, если новые не предоставлены
        const updatedUsername = username || user.username;
        const updatedEmail = email || user.email;
        const updatedAvatarUrl = avatarUrl !== undefined ? avatarUrl : user.avatar_url;
        
        console.log('Обновление профиля:', { 
            id: userId, 
            username: updatedUsername, 
            email: updatedEmail,
            passwordChanged: newPassword ? true : false
        });

        await query(
            'UPDATE users SET username = $1, email = $2, password_hash = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [updatedUsername, updatedEmail, passwordHash, updatedAvatarUrl, userId]
        );

        return NextResponse.json({ 
            message: 'Профиль успешно обновлён',
            username: updatedUsername,
            email: updatedEmail
        }, { status: 200 });
    } catch (error: unknown) {
        console.error('Update profile error:', error);
        if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === '23505') {
            if ('detail' in error && typeof (error as { detail?: string }).detail === 'string') {
                if ((error as { detail?: string }).detail?.includes('username')) {
                    return NextResponse.json({ error: 'Имя пользователя уже занято' }, { status: 409 });
                }
                if ((error as { detail?: string }).detail?.includes('email')) {
                    return NextResponse.json({ error: 'Email уже используется' }, { status: 409 });
                }
            }
        }
        return NextResponse.json({ error: 'Ошибка при обновлении профиля: ' + (typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : 'Неизвестная ошибка') }, { status: 500 });
    }
}