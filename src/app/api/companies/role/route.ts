import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const currentUserId = session.user.id;
    const { companyId, userId, newRole } = await request.json();
    if (!companyId || !userId || !newRole) {
      return NextResponse.json({ error: 'companyId, userId и newRole обязательны' }, { status: 400 });
    }
    // Проверяем, что currentUserId — owner в этой компании
    const rows = await query<{ role_in_company: string }>(
      'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
      [companyId, currentUserId]
    );
    if (!rows[0] || rows[0].role_in_company !== 'owner') {
      return NextResponse.json({ error: 'Нет прав на смену ролей' }, { status: 403 });
    }
    // Нельзя менять роль владельцу
    const target = await query<{ role_in_company: string }>('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    if (!target[0] || target[0].role_in_company === 'owner') {
      return NextResponse.json({ error: 'Нельзя менять роль владельцу' }, { status: 403 });
    }
    await query('UPDATE company_users SET role_in_company = $1 WHERE company_id = $2 AND user_id = $3', [newRole, companyId, userId]);
    // Логируем смену роли
    await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, currentUserId, 'change_role', JSON.stringify({ userId, newRole })]);
    return NextResponse.json({ message: 'Роль обновлена' }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 