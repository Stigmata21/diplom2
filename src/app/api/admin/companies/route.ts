import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const offset = (page - 1) * pageSize;

    let where = '';
    const params: (string | number)[] = [];
    if (search) {
      where = 'WHERE c.name ILIKE $1';
      params.push(`%${search}%`);
    }

    const companies = await query(
      `SELECT c.id, c.name, COUNT(cu.user_id) as users, c.created_at as created
       FROM companies c
       LEFT JOIN company_users cu ON cu.company_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM companies ${where}`,
      params
    );
    const total = parseInt(totalRes[0]?.count || '0', 10);

    return NextResponse.json({ companies, total });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Не передан id' }, { status: 400 });
    await query('DELETE FROM company_users WHERE company_id = $1', [id]);
    await query('DELETE FROM companies WHERE id = $1', [id]);

    // Логируем действие
    const session = await getServerSession(authOptions);
    await logAdminAction(session?.user?.id || null, 'delete_company', { companyId: id });

    return NextResponse.json({ message: 'Компания удалена' });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    const res = await query<{ id: number }>('INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING id', [name, description || '']);
    await logAdminAction(session?.user?.id || null, 'create_company', { companyId: res[0]?.id, name });
    return NextResponse.json({ id: res[0]?.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { id, name, description } = await req.json();
    if (!id || !name) return NextResponse.json({ error: 'id и name обязательны' }, { status: 400 });
    await query('UPDATE companies SET name = $1, description = $2 WHERE id = $3', [name, description || '', id]);
    await logAdminAction(session?.user?.id || null, 'edit_company', { companyId: id, name });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 