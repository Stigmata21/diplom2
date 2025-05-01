import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const usersRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    const companiesRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM companies');
    const logsRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM logs WHERE created_at > NOW() - INTERVAL '1 week'");
    // График: количество логов по дням за неделю
    const activity = await query<{ day: string, count: string }>(
      "SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as count FROM logs WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY day ORDER BY day"
    );
    return NextResponse.json({
      users: parseInt(usersRes[0]?.count || '0', 10),
      companies: parseInt(companiesRes[0]?.count || '0', 10),
      logs: parseInt(logsRes[0]?.count || '0', 10),
      activity: activity.map(a => ({ day: a.day, count: parseInt(a.count, 10) }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
} 