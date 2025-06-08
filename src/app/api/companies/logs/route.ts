import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const userId = session.user.id;
    // Здесь твоя логика получения логов (например, по companyId или userId)
    // Пример:
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    let logs;
    if (companyId) {
      logs = await query<unknown>('SELECT * FROM company_logs WHERE company_id = $1 ORDER BY created_at DESC LIMIT 100', [companyId]);
    } else {
      logs = await query<unknown>('SELECT * FROM company_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
    }
    return NextResponse.json({ logs });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 