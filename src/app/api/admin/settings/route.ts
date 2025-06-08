import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings = Object.fromEntries(rows.map((r) => {
      const row = r as { key: string, value: string };
      return [row.key, row.value];
    }));
    return NextResponse.json({ settings });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    for (const [key, value] of Object.entries(data)) {
      const res = await query<{ key: string, value: string }>('UPDATE settings SET value = $1 WHERE key = $2 RETURNING *', [value as string, key as string]);
      if (res.length !== 1 || res[0].key !== key || res[0].value !== value) {
        throw new Error('Не удалось обновить настройки');
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}
