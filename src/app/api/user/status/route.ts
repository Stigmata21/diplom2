import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';

interface UserStatus {
  is_active: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Проверяем, был ли передан userId в параметрах запроса
    const userIdParam = searchParams.get('userId');
    
    let userId: string | null = null;
    
    // Если userId не передан, берем из сессии
    if (!userIdParam) {
      const session = await getServerSession(authOptions);
      
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }
      
      userId = session.user.id;
    } else {
      userId = userIdParam;
    }
    
    const result = await query<UserStatus>('SELECT is_active FROM users WHERE id = $1', [userId]);
    
    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      is_active: result[0].is_active,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Ошибка при получении статуса пользователя:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 