import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';

// PUT /api/companies/[companyId]/tasks/[taskId]
export async function PUT(req: NextRequest, { params }: { params: { companyId: string, taskId: string } }) {
  const { companyId, taskId } = await params;
  const { title, description, status, assignee_id } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  // Проверяем, что пользователь — owner компании
  const rows = await query<any>('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
  if (!rows[0] || rows[0].role_in_company !== 'owner') {
    return NextResponse.json({ error: 'Нет прав на редактирование задачи' }, { status: 403 });
  }
  try {
    await query<any>(
      `UPDATE tasks SET title = $1, description = $2, status = $3, assignee_id = $4, updated_at = NOW() WHERE id = $5 AND company_id = $6`,
      [title, description, status, assignee_id, taskId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка обновления задачи' }, { status: 500 });
  }
}

// DELETE /api/companies/[companyId]/tasks/[taskId]
export async function DELETE(req: NextRequest, { params }: { params: { companyId: string, taskId: string } }) {
  const { companyId, taskId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  // Проверяем, что пользователь — owner компании
  const rows = await query<any>('SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, userId]);
  if (!rows[0] || rows[0].role_in_company !== 'owner') {
    return NextResponse.json({ error: 'Нет прав на удаление задачи' }, { status: 403 });
  }
  try {
    await query<any>(
      `DELETE FROM tasks WHERE id = $1 AND company_id = $2`,
      [taskId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка удаления задачи' }, { status: 500 });
  }
} 