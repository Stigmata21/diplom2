import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { query } from '../../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const { companyId, email, role } = await req.json();
    if (!companyId || !email || !role) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    // Проверяем, что отправитель — админ или владелец
    const perms = await query('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, session.user.id]);
    if (!perms[0] || (perms[0] as any).role_in_company !== 'owner' && (perms[0] as any).role_in_company !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на приглашение' }, { status: 403 });
    }
    // Проверяем, не состоит ли email уже в компании
    const user = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (user[0]) {
      const inCompany = await query('SELECT 1 FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, (user[0] as any).id]);
      if (inCompany[0]) {
        return NextResponse.json({ error: 'Пользователь уже в компании' }, { status: 409 });
      }
    }
    // Проверяем, нет ли уже pending инвайта
    const existing = await query('SELECT id FROM company_invites WHERE company_id = $1 AND email = $2 AND status = $3', [companyId, email, 'pending']);
    if (existing[0]) {
      return NextResponse.json({ error: 'Уже есть активное приглашение' }, { status: 409 });
    }
    // Создаём инвайт
    await query('INSERT INTO company_invites (company_id, email, role, status, invited_by) VALUES ($1, $2, $3, $4, $5)', [companyId, email, role, 'pending', session.user.id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка приглашения' }, { status: 500 });
  }
} 