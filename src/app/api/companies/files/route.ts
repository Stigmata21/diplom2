import { NextRequest, NextResponse } from 'next/server';

// files: { [companyId: string]: FileItem[] }
let files: Record<string, any[]> = {};

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  return NextResponse.json({ files: files[companyId] || [] });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const description = formData.get('description') as string;
  const companyId = formData.get('companyId') as string;
  if (!file) return NextResponse.json({ error: 'Нет файла' }, { status: 400 });
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  if (!files[companyId]) files[companyId] = [];
  const id = Math.random().toString(36).slice(2);
  files[companyId].push({
    id,
    name: file.name,
    url: '#',
    description: description || '',
    uploadedBy: 'Пользователь',
    createdAt: new Date().toISOString(),
    canEdit: true,
  });
  return NextResponse.json({ success: true });
} 