import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const users = await query(
      `SELECT u.id, u.username as name, MAX(sc.created_at) as last_message
       FROM support_chat sc
       JOIN users u ON u.id = sc.user_id
       WHERE sc.created_at > NOW() - INTERVAL '3 days'
       GROUP BY u.id, u.username
       ORDER BY last_message DESC`
    );
    return NextResponse.json({ users });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 