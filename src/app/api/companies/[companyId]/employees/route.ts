import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/companies/[companyId]/employees
export async function GET(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  if (!companyId) return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  try {
    const employees = await query<any>(
      `SELECT u.id, u.username, u.email, cu.role_in_company as role, cu.salary, cu.note
       FROM company_users cu
       JOIN users u ON cu.user_id = u.id
       WHERE cu.company_id = $1
       ORDER BY cu.role_in_company DESC, u.username ASC`,
      [companyId]
    );
    return NextResponse.json({ employees }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка получения сотрудников' }, { status: 500 });
  }
}

// POST /api/companies/[companyId]/employees
export async function POST(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  const { name, email, role, salary, note } = await req.json();
  if (!companyId || !email || !name) return NextResponse.json({ error: 'companyId, name, email обязательны' }, { status: 400 });
  try {
    // 1. Найти или создать пользователя
    let users = await query<any>('SELECT id FROM users WHERE email = $1', [email]);
    let userId = users[0]?.id;
    if (!userId) {
      const newUsers = await query<any>('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id', [name, email, '']);
      userId = newUsers[0].id;
    }
    // 2. Проверить, есть ли уже такой сотрудник в компании
    const exists = await query<any>('SELECT 1 FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    if (exists.length > 0) {
      return NextResponse.json({ error: 'Пользователь уже добавлен в компанию' }, { status: 400 });
    }
    // 3. Добавить в company_users
    await query<any>(
      'INSERT INTO company_users (company_id, user_id, role_in_company, salary, note) VALUES ($1, $2, $3, $4, $5)',
      [companyId, userId, role || 'employee', salary || 0, note || '']
    );
    // TODO: добавить запись в историю изменений
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка добавления сотрудника' }, { status: 500 });
  }
} 