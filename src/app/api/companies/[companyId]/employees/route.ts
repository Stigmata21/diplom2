import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';
import bcrypt from 'bcrypt';

// GET /api/companies/[companyId]/employees
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_: unknown, context: any) {
  const params = await context.params;
  const { companyId } = params;
  if (!companyId) return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  try {
    const employees = await query<{ id: number, username: string, email: string, role_in_company: string, salary: number, note: string }>(
      `SELECT u.id, u.username, u.email, cu.role_in_company, cu.salary, cu.note
       FROM company_users cu
       JOIN users u ON cu.user_id = u.id
       WHERE cu.company_id = $1
       ORDER BY cu.role_in_company DESC, u.username ASC`,
      [companyId]
    );
    // Маппинг ролей для фронта
    const mapped = employees.map((e) => ({
      id: e.id,
      name: e.username || '',
      email: e.email || '',
      role: e.role_in_company === 'owner' ? 'owner' : e.role_in_company === 'admin' ? 'admin' : 'employee',
      salary: e.salary || 0,
      note: e.note || '',
    }));
    return NextResponse.json({ employees: mapped }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Ошибка получения сотрудников' }, { status: 500 });
  }
}

// POST /api/companies/[companyId]/employees
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: Request, context: any) {
  const params = await context.params;
  const { companyId } = params;
  const { email, role, salary, note } = await req.json();
  if (!companyId || !email) return NextResponse.json({ error: 'companyId и email обязательны' }, { status: 400 });
  try {
    // Проверяем права (owner/admin)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const currentUserId = session.user.id;
    const perms = await query<{ role_in_company: string }>(
      'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
      [companyId, currentUserId]
    );
    if (!perms[0] || (perms[0].role_in_company !== 'owner' && perms[0].role_in_company !== 'admin')) {
      return NextResponse.json({ error: 'Нет прав на добавление сотрудников' }, { status: 403 });
    }
    // Ищем пользователя по email
    let users = await query<{ id: number, username: string, email: string }>('SELECT id, username, email FROM users WHERE email = $1', [email]);
    let userId: number;
    let username: string;
    if (!users[0]) {
      // Автосоздание пользователя
      username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 7);
      const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const inserted = await query<{ id: number }>(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
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
    const exists = await query<{ exists: number }>('SELECT 1 as exists FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    if (exists[0]) {
      return NextResponse.json({ error: 'Пользователь уже в компании' }, { status: 409 });
    }
    // Добавляем сотрудника
    await query('INSERT INTO company_users (user_id, company_id, role_in_company, salary, note) VALUES ($1, $2, $3, $4, $5)', [userId, companyId, role || 'member', salary || 0, note || '']);
    // Логируем добавление сотрудника
    await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, currentUserId, 'add_employee', JSON.stringify({ addedUserId: userId, email })]);
    return NextResponse.json({ employee: { id: userId, username, email, role_in_company: role || 'member', salary: salary || 0, note: note || '' } }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка добавления сотрудника' }, { status: 500 });
  }
} 