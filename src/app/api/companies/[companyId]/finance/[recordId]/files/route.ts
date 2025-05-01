import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// POST /api/companies/[companyId]/finance/[recordId]/files
export async function POST(req: NextRequest, context: { params: { companyId: string, recordId: string } }) {
  const params = await context.params;
  const { companyId, recordId } = params;
  const recordIdNum = Number(recordId);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const userId = session.user.id;
  // Проверяем права: owner/admin или автор (если pending)
  const rows = await query<{ author_id: string; status: string; role_in_company: string }>(
    `SELECT r.author_id, r.status, cu.role_in_company FROM finance_records r
     JOIN company_users cu ON cu.company_id = r.company_id AND cu.user_id = $1
     WHERE r.id = $2 AND r.company_id = $3`,
    [userId, recordIdNum, companyId]
  );
  const isAuthor = rows[0]?.author_id == userId;
  const isAdmin = rows[0]?.role_in_company === 'owner' || rows[0]?.role_in_company === 'admin';
  const isPending = rows[0]?.status === 'pending';
  if (!isAdmin && !(isAuthor && isPending)) {
    return NextResponse.json({ error: 'Нет прав на загрузку файла' }, { status: 403 });
  }
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'Файл обязателен' }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
  await fs.writeFile(uploadPath, buffer);
  const url = `/uploads/${filename}`;
  try {
    console.log('Попытка вставки файла:', { recordId: recordIdNum, fileName: file.name });
    const inserted = await query<{ id: number; filename: string; url: string; mimetype: string; size: number; created_at?: string }>(
      'INSERT INTO finance_files (record_id, filename, url, mimetype, size) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [recordIdNum, file.name, url, file.type || 'application/octet-stream', file.size]
    );
    console.log('Результат вставки файла:', inserted);
    if (!inserted || !inserted[0]) {
      return NextResponse.json({ error: 'Файл не был добавлен в базу (inserted пустой)' }, { status: 500 });
    }
    return NextResponse.json({ file: inserted[0] }, { status: 201 });
  } catch (e: any) {
    console.error('Ошибка вставки файла в finance_files:', e);
    return NextResponse.json({ error: e.message || 'Ошибка загрузки файла' }, { status: 500 });
  }
}

// GET /api/companies/[companyId]/finance/[recordId]/files
export async function GET(req: NextRequest, context: { params: { companyId: string, recordId: string } }) {
  const params = await context.params;
  const { recordId } = params;
  const recordIdNum = Number(recordId);
  try {
    const files = await query<{ id: number; filename: string; url: string; mimetype: string; size: number; created_at?: string }>(
      'SELECT id, filename, url, mimetype, size FROM finance_files WHERE record_id = $1',
      [recordIdNum]
    );
    return NextResponse.json({ files }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка получения файлов' }, { status: 500 });
  }
} 