import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Получаем текущий токен из cookie
  const sessionToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'No session token' }, { status: 400 });
  }
  // Ставим maxAge 30 дней
  const maxAge = 60 * 60 * 24 * 30;
  const res = NextResponse.json({ ok: true });
  res.cookies.set('next-auth.session-token', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  res.cookies.set('__Secure-next-auth.session-token', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    secure: true,
  });
  return res;
} 