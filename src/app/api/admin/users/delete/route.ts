import { NextRequest, NextResponse } from 'next/server';
import { query, logAdminAction } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
    }
    
    // Проверяем, не пытается ли админ удалить себя
    const session = await getServerSession(authOptions);
    if (session?.user?.id?.toString() === id) {
      return NextResponse.json({ error: 'Нельзя удалить свою учетную запись' }, { status: 403 });
    }
    
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    // Логируем действие
    await logAdminAction(session?.user?.id || null, 'delete_user', { targetUserId: id });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error);
    return NextResponse.json({ error: 'Ошибка сервера', details: String(error) }, { status: 500 });
  }
} 