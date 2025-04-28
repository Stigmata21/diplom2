import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const active = searchParams.get('active');
  if (!id || typeof active === 'undefined') {
    return NextResponse.json({ error: 'id и active обязательны' }, { status: 400 });
  }
  const isActive = active === 'true' || active === '1';
  await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);
  return NextResponse.json({ success: true }, { status: 200 });
} 