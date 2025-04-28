import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const role = searchParams.get('role');
  if (!id || !role) {
    return NextResponse.json({ error: 'id и role обязательны' }, { status: 400 });
  }
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  return NextResponse.json({ success: true }, { status: 200 });
} 