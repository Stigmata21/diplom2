import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId обязателен' }, { status: 400 });
    const rows = await query(
      `SELECT * FROM support_chat WHERE user_id = $1 AND created_at > NOW() - INTERVAL '3 days' ORDER BY created_at ASC`,
      [userId]
    );
    // Маппируем для фронта
    const messages = rows.map((row: any) => ({
      from: row.from_moderator ? 'moderator' : 'user',
      text: row.message,
      userId: String(row.user_id),
      moderatorId: row.from_moderator ? (row.moderator_id ? String(row.moderator_id) : '1') : undefined,
      created_at: row.created_at,
    }));
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
} 