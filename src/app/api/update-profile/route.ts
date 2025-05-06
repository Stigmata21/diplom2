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
        const { userId, username, email, currentPassword, newPassword, avatarUrl } = await request.json();

        if (!userId || !username || !email) {
            return NextResponse.json({ error: 'Все обязательные поля должны быть заполнены' }, { status: 400 });
        }

        const users = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
        const user = users[0];

        if (!user) {
            return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
        }

        if (currentPassword && !(await bcrypt.compare(currentPassword, user.password_hash))) {
            return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
        }

        let passwordHash = user.password_hash;
        if (newPassword) {
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(newPassword, saltRounds);
        }

        await query(
            'UPDATE users SET username = $1, email = $2, password_hash = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [username, email, passwordHash, avatarUrl || user.avatar_url, userId]
        );

        return NextResponse.json({ message: 'Профиль успешно обновлён' }, { status: 200 });
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