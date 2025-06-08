import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export async function PATCH(request: NextRequest) {
  try {
    const { id, active } = await request.json();
    if (!id || typeof active === 'undefined') {
      return NextResponse.json({ error: 'id и active обязательны' }, { status: 400 });
    }
    
    const isActive = active === true;
    await query('UPDATE users SET is_active = $1 WHERE id = $2', [isActive, id]);

    // Логируем действие
    const session = await getServerSession(authOptions);
    await logAdminAction(session?.user?.id || null, isActive ? 'unban_user' : 'ban_user', { targetUserId: id });

    return NextResponse.json({ success: true, is_active: isActive }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера', details: String(error) }, { status: 500 });
  }
} 