import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/authOptions';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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

// GET: Get a specific file
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: recordId, fileId } = await params;
    
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

    // Get the file
    const files = await query<FinanceFile>('SELECT * FROM finance_files WHERE id = $1 AND record_id = $2', [fileId, recordId]);
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    return NextResponse.json({ file: files[0] });
  } catch (error) {
    console.error('Ошибка при получении файла:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE: Delete a file
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: recordId, fileId } = await params;
    
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

    // Check if user has edit permissions (owner, admin or author)
    const userRole = companies[0].role_in_company;
    const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

    // Get the file info before deleting
    const files = await query<FinanceFile>('SELECT * FROM finance_files WHERE id = $1 AND record_id = $2', [fileId, recordId]);
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    const file = files[0];

    // Only owner or admin can delete files
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Недостаточно прав для удаления файла' }, { status: 403 });
    }

    // Delete from database
    await query('DELETE FROM finance_files WHERE id = $1', [fileId]);

    // Try to delete the file from filesystem
    try {
      // Extract the filename from the URL path
      const urlPath = new URL(file.url, 'http://localhost').pathname;
      const filename = path.basename(urlPath);
      const filePath = path.join(process.cwd(), 'uploads', 'finance', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Ошибка при удалении файла из файловой системы:', err);
      // Continue even if file deletion fails
    }

    // Log the action
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`,
      [
        record.company_id,
        session.user.id,
        'Удаление файла финансовой записи',
        JSON.stringify({ recordId, filename: file.filename })
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 