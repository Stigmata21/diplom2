import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
  }
  await query('DELETE FROM users WHERE id = $1', [id]);
  return NextResponse.json({ success: true }, { status: 200 });
} 