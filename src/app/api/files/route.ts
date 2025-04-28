import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

// Получить список файлов компании
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  }
  try {
    const files = await query<any>(
      'SELECT id, filename, url, mimetype, size, version, created_at FROM files WHERE company_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [companyId]
    );
    return NextResponse.json({ files }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка получения файлов' }, { status: 500 });
  }
}

// Загрузить файл (заглушка, без реального upload)
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const companyId = formData.get('companyId');
  if (!file || !companyId) {
    return NextResponse.json({ error: 'file и companyId обязательны' }, { status: 400 });
  }
  // В реальном проекте тут будет upload в S3/Cloud + генерация url
  const filename = file.name;
  const mimetype = file.type || 'application/octet-stream';
  const size = file.size || 0;
  const url = `/uploads/${Date.now()}_${filename}`; // Заглушка
  try {
    const inserted = await query<any>(
      'INSERT INTO files (company_id, user_id, filename, url, mimetype, size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, filename, url, mimetype, size, version, created_at',
      [companyId, 1, filename, url, mimetype, size] // user_id=1 заглушка
    );
    return NextResponse.json({ file: inserted[0] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
  }
}

// Удалить файл (мягкое удаление)
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
  }
  try {
    await query('UPDATE files SET deleted_at = NOW() WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка удаления файла' }, { status: 500 });
  }
} 