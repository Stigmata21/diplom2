import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/companies/[companyId]/finance/[recordId]
export async function PUT(req: NextRequest, { params }: { params: { companyId: string, recordId: string } }) {
  const { companyId, recordId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  const { type, category, amount, currency, description, status } = await req.json();
  // Проверяем права: owner/admin или автор (если pending)
  const rows = await query<{ author_id: string; status: string; role_in_company: string }>(
    `SELECT r.author_id, r.status, cu.role_in_company FROM finance_records r
     JOIN company_users cu ON cu.company_id = r.company_id AND cu.user_id = $1
     WHERE r.id = $2 AND r.company_id = $3`,
    [userId, recordId, companyId]
  );
  const isAuthor = rows[0]?.author_id == userId;
  const isAdmin = rows[0]?.role_in_company === 'owner' || rows[0]?.role_in_company === 'admin';
  const isPending = rows[0]?.status === 'pending';
  if (!isAdmin && !(isAuthor && isPending)) {
    return NextResponse.json({ error: 'Нет прав на редактирование записи' }, { status: 403 });
  }
  try {
    await query(
      `UPDATE finance_records SET type = $1, category = $2, amount = $3, currency = $4, description = $5, status = $6, updated_at = NOW() WHERE id = $7 AND company_id = $8`,
      [type, category, amount, currency, description, status, recordId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка обновления записи' }, { status: 500 });
  }
}

// DELETE /api/companies/[companyId]/finance/[recordId]
export async function DELETE(req: NextRequest, { params }: { params: { companyId: string, recordId: string } }) {
  const { companyId, recordId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  // Проверяем права: owner/admin или автор (если pending)
  const rows = await query<{ author_id: string; status: string; role_in_company: string }>(
    `SELECT r.author_id, r.status, cu.role_in_company FROM finance_records r
     JOIN company_users cu ON cu.company_id = r.company_id AND cu.user_id = $1
     WHERE r.id = $2 AND r.company_id = $3`,
    [userId, recordId, companyId]
  );
  const isAuthor = rows[0]?.author_id == userId;
  const isAdmin = rows[0]?.role_in_company === 'owner' || rows[0]?.role_in_company === 'admin';
  const isPending = rows[0]?.status === 'pending';
  if (!isAdmin && !(isAuthor && isPending)) {
    return NextResponse.json({ error: 'Нет прав на удаление записи' }, { status: 403 });
  }
  try {
    await query(
      `DELETE FROM finance_records WHERE id = $1 AND company_id = $2`,
      [recordId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка удаления записи' }, { status: 500 });
  }
} 