import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  const files = await query<{ id: number, name: string, description: string, path: string, uploaded_by: string, created_at: string }>(
    'SELECT id, name, description, path, uploaded_by, created_at FROM company_files WHERE company_id = $1 ORDER BY created_at DESC',
    [companyId]
  );
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const description = formData.get('description') as string;
  const companyId = formData.get('companyId') as string;
  const uploadedBy = formData.get('uploadedBy') as string || null;
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'Нет файла' }, { status: 400 });
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  const fileName = Date.now() + '-' + (file.name || 'file');
  const companyDir = path.join(UPLOADS_DIR, companyId);
  if (!fs.existsSync(companyDir)) fs.mkdirSync(companyDir, { recursive: true });
  const filePath = path.join(companyDir, fileName);
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  const relPath = `/uploads/${companyId}/${fileName}`;
  const rows = await query<{ id: number, name: string, description: string, path: string, uploaded_by: string, created_at: string }>(
    'INSERT INTO company_files (company_id, name, description, path, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, path, uploaded_by, created_at',
    [companyId, file.name, description || '', relPath, uploadedBy]
  );
  return NextResponse.json({ file: rows[0] });
} 