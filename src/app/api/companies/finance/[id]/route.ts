import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/authOptions';
import { query } from '@/lib/db';

// Типы данных
interface FinanceRecord {
  id: string;
  company_id: string;
  author_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface CompanyUser {
  role_in_company: string;
}

// GET: Получение отдельной финансовой записи
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const recordId = params.id;
    
    // Получаем запись с проверкой доступа
    const records = await query<any>(
      `SELECT fr.*, cu.role_in_company, u.username as author_name
       FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       JOIN users u ON fr.author_id = u.id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [recordId, session.user.id]
    );

    if (records.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    return NextResponse.json({ record: records[0] });
  } catch (error) {
    console.error('Ошибка при получении финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT: Обновление финансовой записи
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const recordId = params.id;
    const { type, category, amount, currency, description, status } = await req.json();

    // Получаем текущую запись с проверкой доступа
    const records = await query<any>(
      `SELECT fr.*, cu.role_in_company 
       FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [recordId, session.user.id]
    );

    if (records.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    const record = records[0];
    const userRole = record.role_in_company;

    // Проверяем права на редактирование
    if (record.author_id !== session.user.id && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на редактирование записи' }, { status: 403 });
    }

    // Обновляем запись
    const result = await query<any>(
      `UPDATE finance_records
       SET type = $1, category = $2, amount = $3, currency = $4, description = $5, status = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        type || record.type,
        category || record.category,
        amount || record.amount,
        currency || record.currency,
        description !== undefined ? description : record.description,
        status || record.status,
        recordId
      ]
    );

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        record.company_id, 
        session.user.id, 
        'Обновление финансовой записи', 
        JSON.stringify({ recordId, type, category, amount })
      ]
    );

    // Добавляем имя автора для ответа
    const users = await query<{username: string}>('SELECT username FROM users WHERE id = $1', [record.author_id]);
    const author_name = users.length > 0 ? users[0].username : 'Неизвестный пользователь';
    
    const updatedRecord = { ...result[0], author_name };

    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    console.error('Ошибка при обновлении финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE: Удаление финансовой записи
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const recordId = params.id;

    // Получаем текущую запись с проверкой доступа
    const records = await query<any>(
      `SELECT fr.*, cu.role_in_company 
       FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [recordId, session.user.id]
    );

    if (records.length === 0) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    const record = records[0];
    const userRole = record.role_in_company;

    // Проверяем права на удаление
    if (record.author_id !== session.user.id && userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на удаление записи' }, { status: 403 });
    }

    // Удаляем запись
    await query('DELETE FROM finance_records WHERE id = $1', [recordId]);

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        record.company_id, 
        session.user.id, 
        'Удаление финансовой записи', 
        JSON.stringify({ recordId, type: record.type, category: record.category })
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 