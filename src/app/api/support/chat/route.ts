import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Получить историю чата (последние 3 дня)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Нет авторизации' }, { status: 401 });
    const rows = await query(
      `SELECT * FROM support_chat WHERE user_id = $1 AND created_at > NOW() - INTERVAL '3 days' ORDER BY created_at ASC`,
      [userId]
    );
    // Маппируем для фронта
    const messages = rows.map((row: any) => ({
      from: row.from_moderator ? 'moderator' : 'user',
      text: row.message,
      userId: String(row.user_id),
      moderatorId: row.from_moderator ? '1' : undefined, // если нужно, можно хранить id модератора
      created_at: row.created_at,
    }));
    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}

// Отправить новое сообщение
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Нет авторизации' }, { status: 401 });
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Пустое сообщение' }, { status: 400 });
    await query(
      'INSERT INTO support_chat (user_id, message, from_moderator) VALUES ($1, $2, FALSE)',
      [userId, message]
    );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}

// Удалить старые сообщения (старше 3 дней)
export async function DELETE() {
  try {
    await query(`DELETE FROM support_chat WHERE created_at < NOW() - INTERVAL '3 days'`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
} 