import { NextRequest, NextResponse } from 'next/server';

type ErrorMessages = {
  [key: string]: string;
};

// Словарь локализованных сообщений об ошибках
const errorMessages: ErrorMessages = {
  'Неверный email или пароль': 'Неверный email или пароль',
  'UserBanned': 'Пользователь заблокирован',
  'AccessDenied': 'Доступ запрещен',
  'Verification': 'Ошибка верификации',
  'OAuthCallback': 'Ошибка авторизации через OAuth',
  'OAuthSignin': 'Ошибка входа через OAuth',
  'OAuthAccountNotLinked': 'Аккаунт не связан с OAuth',
  'EmailCreateAccount': 'Ошибка при создании аккаунта',
  'EmailSignin': 'Ошибка входа по email',
  'SessionRequired': 'Требуется авторизация',
  'default': 'Ошибка авторизации'
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorCode = searchParams.get('error');
  
  if (!errorCode) {
    return NextResponse.json({ error: 'Не указан код ошибки' }, { status: 400 });
  }
  
  // Ищем точное совпадение с кодом ошибки
  if (errorCode in errorMessages) {
    return NextResponse.json({ message: errorMessages[errorCode] });
  }
  
  // Если точного совпадения нет, ищем частичное совпадение
  for (const key of Object.keys(errorMessages)) {
    if (errorCode.includes(key)) {
      return NextResponse.json({ message: errorMessages[key] });
    }
  }
  
  // Если ничего не найдено, возвращаем сообщение по умолчанию
  return NextResponse.json({ message: errorMessages.default });
} 