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
    const messages = rows.map((r) => {
      const row = r as { from_moderator: boolean; message: string; user_id: number; moderator_id?: number; created_at: string };
      return {
        from: row.from_moderator ? 'moderator' : 'user',
        text: row.message,
        userId: String(row.user_id),
        moderatorId: row.from_moderator ? (row.moderator_id ? String(row.moderator_id) : '1') : undefined,
        created_at: row.created_at,
      };
    });
    return NextResponse.json({ messages });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId обязателен' }, { status: 400 });
    const body = await req.json();
    const message = body.message;
    if (!message) return NextResponse.json({ error: 'message обязателен' }, { status: 400 });
    const res = await query<{ message: string }>('INSERT INTO support_chat (user_id, message) VALUES ($1, $2) RETURNING *', [userId, message]);
    return NextResponse.json({ message: res[0]?.message });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 