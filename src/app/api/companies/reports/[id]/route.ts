import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/authOptions';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET: Получение отдельного отчета
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const reportId = params.id;
    
    // Получаем отчет с проверкой доступа
    const reports = await query<any>(
      `SELECT fr.*, cu.role_in_company, u.username as author_name
       FROM financial_reports fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       JOIN users u ON fr.author_id = u.id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [reportId, session.user.id]
    );

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Отчет не найден или нет доступа' }, { status: 404 });
    }

    return NextResponse.json({ report: reports[0] });
  } catch (error) {
    console.error('Ошибка при получении отчета:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT: Обновление отчета
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const reportId = params.id;
    const requestData = await req.json();
    const { title, period, type, status, data } = requestData;

    console.log('Обновление отчета ID:', reportId, 'с данными:', requestData);

    // Получаем текущий отчет с проверкой доступа
    const reports = await query<any>(
      `SELECT fr.*, cu.role_in_company 
       FROM financial_reports fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [reportId, session.user.id]
    );

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Отчет не найден или нет доступа' }, { status: 404 });
    }

    const report = reports[0];
    const userRole = report.role_in_company;

    // Проверяем права на редактирование
    if (report.author_id !== session.user.id && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на редактирование отчета' }, { status: 403 });
    }

    // Подготовка данных для обновления
    const dataToUpdate = data || requestData.data || report.data;
    const jsonData = typeof dataToUpdate === 'string' 
      ? dataToUpdate 
      : JSON.stringify(dataToUpdate);
    
    console.log('Данные для обновления:', jsonData);

    // Обновляем отчет
    const result = await query<any>(
      `UPDATE financial_reports
       SET title = $1, period = $2, type = $3, data = $4, status = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        title || report.title,
        period || report.period,
        type || report.type,
        jsonData,
        status || report.status,
        reportId
      ]
    );

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        report.company_id, 
        session.user.id, 
        'Обновление финансового отчета', 
        JSON.stringify({ reportId, title: title || report.title })
      ]
    );

    return NextResponse.json({ report: result[0] });
  } catch (error) {
    console.error('Ошибка при обновлении отчета:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE: Удаление отчета
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const reportId = await params.id;

    // Получаем текущий отчет с проверкой доступа
    const reports = await query<any>(
      `SELECT fr.*, cu.role_in_company 
       FROM financial_reports fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [reportId, session.user.id]
    );

    if (reports.length === 0) {
      return NextResponse.json({ error: 'Отчет не найден или нет доступа' }, { status: 404 });
    }

    const report = reports[0];
    const userRole = report.role_in_company;

    // Проверяем права на удаление
    if (report.author_id !== session.user.id && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на удаление отчета' }, { status: 403 });
    }

    // Если есть файл отчета, удаляем его
    if (report.file_url) {
      const filePath = path.join(process.cwd(), report.file_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Удаляем отчет
    await query('DELETE FROM financial_reports WHERE id = $1', [reportId]);

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        report.company_id, 
        session.user.id, 
        'Удаление финансового отчета', 
        JSON.stringify({ reportId, title: report.title })
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении отчета:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 