import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { query } from '@/lib/db';

interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  password_hash: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  name: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем актуальные данные пользователя из базы данных
    const users = await query<User>(
      'SELECT id, username as name, email, avatar_url, role FROM users WHERE id = $1',
      [session.user.id]
    );
    
    const user = users[0];
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Возвращаем обновленные данные пользователя
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) {
    console.error('Ошибка обновления сессии:', error);
    return NextResponse.json({ 
      error: 'Ошибка обновления сессии: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка')
    }, { status: 500 });
  }
} 