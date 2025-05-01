import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/companies/[companyId]/notes/[noteId]
export async function PUT(req: NextRequest, { params }: { params: { companyId: string, noteId: string } }) {
  const { companyId, noteId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  const { title, content } = await req.json();
  // Проверяем права: автор или owner/admin
  const rows = await query<{ author_id: string; role_in_company: string }>(
    `SELECT n.author_id, cu.role_in_company FROM notes n
     JOIN company_users cu ON cu.company_id = n.company_id AND cu.user_id = $1
     WHERE n.id = $2 AND n.company_id = $3`,
    [userId, noteId, companyId]
  );
  const isAuthor = rows[0]?.author_id == userId;
  const isAdmin = rows[0]?.role_in_company === 'owner' || rows[0]?.role_in_company === 'admin';
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: 'Нет прав на редактирование заметки' }, { status: 403 });
  }
  try {
    await query(
      `UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND company_id = $4`,
      [title, content, noteId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка обновления заметки' }, { status: 500 });
  }
}

// DELETE /api/companies/[companyId]/notes/[noteId]
export async function DELETE(req: NextRequest, { params }: { params: { companyId: string, noteId: string } }) {
  const { companyId, noteId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  // Проверяем права: автор или owner/admin
  const rows = await query<{ author_id: string; role_in_company: string }>(
    `SELECT n.author_id, cu.role_in_company FROM notes n
     JOIN company_users cu ON cu.company_id = n.company_id AND cu.user_id = $1
     WHERE n.id = $2 AND n.company_id = $3`,
    [userId, noteId, companyId]
  );
  const isAuthor = rows[0]?.author_id == userId;
  const isAdmin = rows[0]?.role_in_company === 'owner' || rows[0]?.role_in_company === 'admin';
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: 'Нет прав на удаление заметки' }, { status: 403 });
  }
  try {
    await query(
      `DELETE FROM notes WHERE id = $1 AND company_id = $2`,
      [noteId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка удаления заметки' }, { status: 500 });
  }
} 