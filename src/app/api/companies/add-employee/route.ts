import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { verifyToken } from '@/lib/jwt';

function getUserIdFromRequest(request: NextRequest): number | null {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return decoded.id;
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, email } = await request.json();
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    if (!companyId || !email) {
      return NextResponse.json({ error: 'companyId и email обязательны' }, { status: 400 });
    }
    // Проверяем, что currentUserId — owner или admin в этой компании
    const rows = await query<any>(
      'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
      [companyId, currentUserId]
    );
    if (!rows[0] || (rows[0].role_in_company !== 'owner' && rows[0].role_in_company !== 'admin')) {
      return NextResponse.json({ error: 'Нет прав на добавление сотрудников' }, { status: 403 });
    }
    // Ищем пользователя по email
    let users = await query<any>('SELECT id, username, email FROM users WHERE email = $1', [email]);
    let userId: number;
    let username: string;
    if (!users[0]) {
      // Автосоздание пользователя
      username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 7);
      const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const inserted = await query<any>(
        'INSERT INTO users (username, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [username, email, passwordHash, 'user', true]
      );
      userId = inserted[0].id;
      users = [{ id: userId, username, email }];
      // Логируем создание пользователя
      await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, currentUserId, 'create_user_and_add', JSON.stringify({ email, username })]);
    } else {
      userId = users[0].id;
      username = users[0].username;
    }
    // Проверяем, не состоит ли уже в компании
    const exists = await query<any>('SELECT 1 FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    if (exists[0]) {
      return NextResponse.json({ error: 'Пользователь уже в компании' }, { status: 409 });
    }
    // Добавляем сотрудника
    await query('INSERT INTO company_users (user_id, company_id, role_in_company) VALUES ($1, $2, $3)', [userId, companyId, 'member']);
    // Логируем добавление сотрудника
    await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, currentUserId, 'add_employee', JSON.stringify({ addedUserId: userId, email })]);
    return NextResponse.json({ employee: { id: userId, username, email, role_in_company: 'member' } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error', stack: e.stack }, { status: 500 });
  }
} 