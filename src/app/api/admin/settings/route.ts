import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT key, value FROM settings');
    const settings = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    for (const [key, value] of Object.entries(data)) {
      await query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}
