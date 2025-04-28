// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const avatar_url = searchParams.get('avatar_url') || 'https://via.placeholder.com/32';
    if (!username || !email || !password) {
        return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    if (username.length < 3) {
        return NextResponse.json({ error: 'Имя пользователя слишком короткое' }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ error: 'Пароль слишком короткий' }, { status: 400 });
    }
    const existingUsername = await query<any>('SELECT 1 FROM users WHERE username = $1', [username]);
    if (existingUsername.length > 0) {
        return NextResponse.json({ error: 'Пользователь с таким username уже существует' }, { status: 400 });
    }
    const existingEmail = await query<any>('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existingEmail.length > 0) {
        return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // ВАЖНО: роль должна быть корректной для enum user_role
    const result = await query<any>(
        "INSERT INTO users (username, email, password_hash, role, created_at, updated_at, is_active, avatar_url) VALUES ($1, $2, $3, 'user', NOW(), NOW(), $4, $5) RETURNING id, username, email, avatar_url",
        [username, email, hashedPassword, true, avatar_url]
    );
    const user = result[0];
    return NextResponse.json({
        user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url },
    }, { status: 201 });
}