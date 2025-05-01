import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
  }
  await query('DELETE FROM users WHERE id = $1', [id]);

  // Логируем действие
  const session = await getServerSession(authOptions);
  await logAdminAction(session?.user?.id || null, 'delete_user', { targetUserId: id });

  return NextResponse.json({ success: true }, { status: 200 });
} 