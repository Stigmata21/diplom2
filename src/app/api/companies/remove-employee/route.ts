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
    const { companyId, userId } = await request.json();
    const currentUserId = getUserIdFromRequest(request);
    if (!currentUserId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'companyId и userId обязательны' }, { status: 400 });
    }
    if (userId === currentUserId) {
      return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 403 });
    }
    // Проверяем роль удаляемого
    const target = await query<any>('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    if (!target[0]) {
      return NextResponse.json({ error: 'Пользователь не найден в компании' }, { status: 404 });
    }
    if (target[0].role_in_company === 'owner') {
      return NextResponse.json({ error: 'Нельзя удалить владельца' }, { status: 403 });
    }
    // Проверяем, что currentUserId — owner или admin в этой компании
    const rows = await query<any>(
      'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
      [companyId, currentUserId]
    );
    if (!rows[0] || (rows[0].role_in_company !== 'owner' && rows[0].role_in_company !== 'admin')) {
      return NextResponse.json({ error: 'Нет прав на удаление сотрудников' }, { status: 403 });
    }
    // Удаляем сотрудника
    await query('DELETE FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
    // Логируем удаление сотрудника
    await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, currentUserId, 'remove_employee', JSON.stringify({ removedUserId: userId })]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error', stack: e.stack }, { status: 500 });
  }
} 