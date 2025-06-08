import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const avatarPath = url.searchParams.get('path');
  
  if (!avatarPath) {
    return NextResponse.json({ exists: false, error: 'No path provided' }, { status: 400 });
  }
  
  try {
    // Проверяем только файлы из директории uploads
    if (!avatarPath.startsWith('/uploads/')) {
      return NextResponse.json({ exists: false, error: 'Invalid path' }, { status: 400 });
    }
    
    // Получаем относительный путь к файлу
    const relativePath = avatarPath.replace(/^\//, '');
    const fullPath = path.join(process.cwd(), 'public', relativePath);
    
    // Проверяем существование файла
    const exists = existsSync(fullPath);
    
    console.log(`Checking avatar file ${fullPath}: ${exists ? 'exists' : 'not found'}`);
    
    return NextResponse.json({ 
      exists,
      path: avatarPath,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error checking avatar file:', error);
    return NextResponse.json({ 
      exists: false, 
      error: 'Error checking file'
    }, { status: 500 });
  }
} 