import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

// GET /api/companies/[companyId]/notes
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  if (!companyId) return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  try {
    const notes = await query<unknown>(
      `SELECT n.id, n.title, n.content, n.created_at, n.updated_at, u.username as author_name, u.id as author_id
       FROM notes n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.company_id = $1
       ORDER BY n.created_at DESC`,
      [companyId]
    );
    return NextResponse.json({ notes }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Ошибка получения заметок' }, { status: 500 });
  }
}

// POST /api/companies/[companyId]/notes
export async function POST(
  req: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  const { title, content } = await req.json();
  if (!companyId || !title || !content) return NextResponse.json({ error: 'companyId, title, content обязательны' }, { status: 400 });
  try {
    const result = await query<unknown>(
      `INSERT INTO notes (company_id, author_id, title, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [companyId, userId, title, content]
    );
    return NextResponse.json({ note: result[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка создания заметки' }, { status: 500 });
  }
}

// PUT /api/companies/[companyId]/notes/[noteId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ companyId: string, noteId: string }> }
) {
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
    await query<unknown>(
      `UPDATE notes SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 AND company_id = $4`,
      [title, content, noteId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка обновления заметки' }, { status: 500 });
  }
}

// DELETE /api/companies/[companyId]/notes/[noteId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ companyId: string, noteId: string }> }
) {
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
    await query<unknown>(
      `DELETE FROM notes WHERE id = $1 AND company_id = $2`,
      [noteId, companyId]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка удаления заметки' }, { status: 500 });
  }
} 