import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { description } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await query('UPDATE company_files SET description = $1 WHERE id = $2', [description || '', id]);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  // Получаем путь к файлу
  const rows = await query<{ path: string }>('SELECT path FROM company_files WHERE id = $1', [id]);
  if (!rows[0]) return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  const filePath = path.join(process.cwd(), rows[0].path.replace(/^\//, ''));
  // Удаляем файл с диска
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  // Удаляем запись из БД
  await query('DELETE FROM company_files WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
} 