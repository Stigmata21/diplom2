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
  const { companyId, userId, newRole } = await request.json();
  const currentUserId = getUserIdFromRequest(request);
  if (!currentUserId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  if (!companyId || !userId || !newRole) {
    return NextResponse.json({ error: 'companyId, userId, newRole обязательны' }, { status: 400 });
  }
  if (userId === currentUserId) {
    return NextResponse.json({ error: 'Нельзя менять свою роль' }, { status: 403 });
  }
  // Нельзя менять роль owner (никто не может снять owner с себя или с другого)
  const target = await query<any>('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
  if (target[0]?.role_in_company === 'owner') {
    return NextResponse.json({ error: 'Нельзя менять роль владельца' }, { status: 403 });
  }
  // Проверяем, что currentUserId — owner или admin в этой компании
  const rows = await query<any>(
    'SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2',
    [companyId, currentUserId]
  );
  if (!rows[0] || (rows[0].role_in_company !== 'owner' && rows[0].role_in_company !== 'admin')) {
    return NextResponse.json({ error: 'Нет прав на смену ролей' }, { status: 403 });
  }
  // Меняем роль
  await query('UPDATE company_users SET role_in_company = $1 WHERE company_id = $2 AND user_id = $3', [newRole, companyId, userId]);
  return NextResponse.json({ success: true }, { status: 200 });
} 