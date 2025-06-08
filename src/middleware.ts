import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { query } from '@/lib/db';

interface User {
  id: string;
  is_active: boolean;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  // Если пользователь не авторизован, пропускаем
  if (!token) {
    return NextResponse.next();
  }
  
  // Пытаемся проверить статус пользователя через API
  try {
    // Проверяем, идет ли запрос к API для проверки статуса. Если да, пропускаем
    if (request.nextUrl.pathname.startsWith('/api/user/status')) {
      return NextResponse.next();
    }
    
    // Проверяем, не заблокирован ли пользователь
    const userId = token.id as string;
    const res = await fetch(`${request.nextUrl.origin}/api/user/status?userId=${userId}`);
    
    if (res.ok) {
      const data = await res.json();
      
      // Если пользователь заблокирован и не на странице сообщения о блокировке,
      // перенаправляем на страницу с уведомлением
      if (data.is_active === false && !request.nextUrl.pathname.startsWith('/banned')) {
        return NextResponse.redirect(new URL('/banned', request.url));
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке статуса пользователя:', error);
  }
  
  return NextResponse.next();
}

// Указываем, к каким путям применять middleware
export const config = {
  matcher: [
    // Применяем ко всем путям, кроме аутентификации и статики
    '/((?!_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}; 