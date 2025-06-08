import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const admins = await query(
      `SELECT id, username as name FROM users WHERE role IN ('admin', 'support') ORDER BY username`
    );
    return NextResponse.json({ admins });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 