import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/companies/[companyId]/finance
export async function GET(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  let sql = `SELECT f.*, u.username as author_name FROM finance_records f LEFT JOIN users u ON f.author_id = u.id WHERE f.company_id = $1`;
  const paramsArr: any[] = [companyId];
  if (type) { sql += ' AND f.type = $' + (paramsArr.length + 1); paramsArr.push(type); }
  if (category) { sql += ' AND f.category = $' + (paramsArr.length + 1); paramsArr.push(category); }
  if (status) { sql += ' AND f.status = $' + (paramsArr.length + 1); paramsArr.push(status); }
  if (from) { sql += ' AND f.created_at >= $' + (paramsArr.length + 1); paramsArr.push(from); }
  if (to) { sql += ' AND f.created_at <= $' + (paramsArr.length + 1); paramsArr.push(to); }
  sql += ' ORDER BY f.created_at DESC';
  try {
    const records = await query<any>(sql, paramsArr);
    return NextResponse.json({ records }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка получения финансовых записей' }, { status: 500 });
  }
}

// POST /api/companies/[companyId]/finance
export async function POST(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  const { type, category, amount, currency, description, status } = await req.json();
  if (!companyId || !type || !category || !amount || !currency) return NextResponse.json({ error: 'Обязательные поля: type, category, amount, currency' }, { status: 400 });
  try {
    const result = await query<any>(
      `INSERT INTO finance_records (company_id, author_id, type, category, amount, currency, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
      [companyId, userId, type, category, amount, currency, description || '', status || 'pending']
    );
    return NextResponse.json({ record: result[0] }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка создания финансовой записи' }, { status: 500 });
  }
} 