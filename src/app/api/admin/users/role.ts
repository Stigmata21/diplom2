import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const role = searchParams.get('role');
  if (!id || !role) {
    return NextResponse.json({ error: 'id и role обязательны' }, { status: 400 });
  }
  await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);

  // Логируем действие
  const session = await getServerSession(authOptions);
  await logAdminAction(session?.user?.id || null, 'change_role', { targetUserId: id, newRole: role });

  return NextResponse.json({ success: true }, { status: 200 });
} 