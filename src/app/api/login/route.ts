// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    if (!email || !password) {
        return NextResponse.json({ error: 'Необходимы email и пароль' }, { status: 400 });
    }
    const users = await query<any>('SELECT * FROM users WHERE email = $1', [email]);
    if (users.length === 0) {
        return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
    }
    const user = users[0];
    if (!user.password_hash) {
        return NextResponse.json({ error: 'Пароль не установлен' }, { status: 500 });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }
    if (user.is_active === false) {
        return NextResponse.json({ error: 'Пользователь деактивирован' }, { status: 403 });
    }
    const rememberMe = request.nextUrl.searchParams.get('rememberMe') === 'true';
    const token = signToken({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role,
    });
    const response = NextResponse.json({
        user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url, role: user.role },
    }, { status: 200 });
    response.cookies.set('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60, // 30 дней или 1 час
    });
    return response;
}