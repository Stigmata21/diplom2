import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export async function PATCH(request: NextRequest) {
  try {
    const { id, role } = await request.json();
    if (!id || !role) {
      return NextResponse.json({ error: 'id и role обязательны' }, { status: 400 });
    }
    await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    const session = await getServerSession(authOptions);
    await logAdminAction(session?.user?.id || null, 'change_role', { targetUserId: id, newRole: role });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера', details: String(error) }, { status: 500 });
  }
} 