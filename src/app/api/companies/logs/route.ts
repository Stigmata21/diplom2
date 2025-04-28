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

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  const currentUserId = getUserIdFromRequest(request);
  if (!currentUserId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  if (!companyId) {
    return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  }
  // Проверяем права
  const rows = await query<any>(
    'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
    [companyId, currentUserId]
  );
  if (!rows[0] || (rows[0].role_in_company !== 'owner' && rows[0].role_in_company !== 'admin')) {
    return NextResponse.json({ error: 'Нет прав на просмотр истории' }, { status: 403 });
  }
  // Получаем логи
  const logs = await query<any>(
    `SELECT l.id, l.action, l.meta, l.created_at, u.username
     FROM company_logs l
     LEFT JOIN users u ON l.user_id = u.id
     WHERE l.company_id = $1
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [companyId]
  );
  return NextResponse.json({ logs }, { status: 200 });
} 