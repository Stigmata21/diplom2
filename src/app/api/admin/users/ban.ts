import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const active = searchParams.get('active');
  if (!id || typeof active === 'undefined') {
    return NextResponse.json({ error: 'id и active обязательны' }, { status: 400 });
  }
  const isActive = active === 'true' || active === '1';
  await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);

  // Логируем действие
  const session = await getServerSession(authOptions);
  await logAdminAction(session?.user?.id || null, isActive ? 'unban_user' : 'ban_user', { targetUserId: id });

  return NextResponse.json({ success: true }, { status: 200 });
} 