import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/authOptions';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Types
interface FinanceRecord {
  id: string;
  company_id: string;
}

interface CompanyUser {
  role_in_company: string;
}

interface FinanceFile {
  id: string;
  record_id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  uploaded_at: string;
}

// GET: Get all files for a finance record
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: recordId } = await params;
    
    // Get the finance record to check access
    const records = await query<FinanceRecord>('SELECT * FROM finance_records WHERE id = $1', [recordId]);
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    const record = records[0];

    // Check user access to the company
    const companies = await query<CompanyUser>(
      'SELECT cu.role_in_company FROM company_users cu WHERE cu.user_id = $1 AND cu.company_id = $2',
      [session.user.id, record.company_id]
    );

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Нет доступа к данной компании' }, { status: 403 });
    }

    // Get files for the record
    const files = await query<FinanceFile>(
      'SELECT * FROM finance_files WHERE record_id = $1 ORDER BY uploaded_at DESC',
      [recordId]
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Ошибка при получении файлов для финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Upload a file for a finance record
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: recordId } = await params;
    
    // Get the finance record to check access
    const records = await query<FinanceRecord>('SELECT * FROM finance_records WHERE id = $1', [recordId]);
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 });
    }

    const record = records[0];

    // Check user access to the company
    const companies = await query<CompanyUser>(
      'SELECT cu.role_in_company FROM company_users cu WHERE cu.user_id = $1 AND cu.company_id = $2',
      [session.user.id, record.company_id]
    );

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Нет доступа к данной компании' }, { status: 403 });
    }

    // Process the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'finance');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    
    // Save file info to database
    const fileUrl = `/uploads/finance/${uniqueFilename}`;
    const result = await query<FinanceFile>(`
      INSERT INTO finance_files (record_id, filename, url, mimetype, size)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [recordId, file.name, fileUrl, file.type, file.size]);

    // Log the action
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`,
      [
        record.company_id,
        session.user.id,
        'Загрузка файла к финансовой записи',
        JSON.stringify({ recordId, filename: file.name })
      ]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Ошибка при сохранении файла' }, { status: 500 });
    }

    return NextResponse.json({ file: result[0] });
  } catch (error) {
    console.error('Ошибка при загрузке файла для финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 