import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const offset = (page - 1) * pageSize;

  let where = '';
  let params: any[] = [];
  if (search) {
    where = 'WHERE username ILIKE $1 OR email ILIKE $1';
    params.push(`%${search}%`);
  }

  const users = await query<any>(
    `SELECT id, username, email, role, is_active FROM users ${where} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );
  const totalRes = await query<any>(
    `SELECT COUNT(*) FROM users ${where}`,
    params
  );
  const total = parseInt(totalRes[0]?.count || '0', 10);

  return NextResponse.json({ users, total }, { status: 200 });
} 