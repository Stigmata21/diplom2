import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user') || '';
    const action = searchParams.get('action') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const exportCsv = searchParams.get('export') === 'csv';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const offset = (page - 1) * pageSize;

    let where = [];
    let params: any[] = [];
    if (user) { where.push('u.username ILIKE $' + (params.length + 1)); params.push(`%${user}%`); }
    if (action) { where.push('l.action ILIKE $' + (params.length + 1)); params.push(`%${action}%`); }
    if (from) { where.push('l.created_at >= $' + (params.length + 1)); params.push(from); }
    if (to) { where.push('l.created_at <= $' + (params.length + 1)); params.push(to); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const logs = await query(
      `SELECT l.id, u.username as user, l.action, l.details, l.created_at
       FROM logs l LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );
    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM logs l LEFT JOIN users u ON l.user_id = u.id ${whereClause}`,
      params
    );
    const total = parseInt(totalRes[0]?.count || '0', 10);

    if (exportCsv) {
      const csv = [
        'ID,User,Action,Details,CreatedAt',
        ...logs.map(l => `${l.id},${l.user || ''},${l.action},"${JSON.stringify(l.details || {})}",${l.created_at}`)
      ].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="logs.csv"' }
      });
    }
    return NextResponse.json({ logs, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
} 