import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    // Проверка на уникальность
    const exists = await query('SELECT 1 FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (exists.length > 0) {
      return NextResponse.json({ error: 'Email или имя пользователя уже заняты' }, { status: 409 });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await query(
      'INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email',
      [username, email, password_hash, 'user', true]
    );
    return NextResponse.json({ user: user[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка регистрации' }, { status: 500 });
  }
} 