import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  }
  try {
    const employees = await query<unknown>(
      `SELECT u.id, u.username, u.email, cu.role_in_company
       FROM company_users cu
       JOIN users u ON cu.user_id = u.id
       WHERE cu.company_id = $1
       ORDER BY cu.role_in_company DESC, u.username ASC`,
      [companyId]
    );
    return NextResponse.json({ employees }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Ошибка получения сотрудников' }, { status: 500 });
  }
} 