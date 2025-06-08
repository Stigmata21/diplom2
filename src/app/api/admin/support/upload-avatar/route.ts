import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'Нет файла' }, { status: 400 });
    const ext = file.name.split('.').pop() || 'png';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `support-avatar.${ext}`;
    const filePath = path.join(process.cwd(), 'public', fileName);
    await writeFile(filePath, buffer);
    return NextResponse.json({ url: `/${fileName}` });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка загрузки' }, { status: 500 });
  }
} 