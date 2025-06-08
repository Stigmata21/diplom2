import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/authOptions';
import { query } from '@/lib/db';

interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

interface UserAccess {
  role: string;
}

interface FinanceRecord {
  id: number;
  company_id: number;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  author_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface CompanyUser {
  role_in_company: string;
}

interface Params {
  params: {
    id: string;
  };
}

// GET: Получение отдельной финансовой записи
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const companyId = params.id;
    
    // Получаем запись с проверкой доступа
    const result = await query(
      `SELECT fr.*, u.name as author_name
       FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       JOIN users u ON fr.author_id = u.id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [companyId, session.user.id]
    );

    if (!result.length) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Ошибка при получении финансовых записей:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// PUT: Обновление финансовой записи
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const recordId = params.id;
    const { type, category, amount, currency, description, status } = await request.json();

    // Получаем текущую запись с проверкой доступа
    const record = await query<FinanceRecord>(
      `SELECT fr.* FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [recordId, session.user.id]
    );

    if (!record.length) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    // Обновляем запись
    const result = await query<FinanceRecord>(
      `UPDATE finance_records
       SET type = $1, category = $2, amount = $3, currency = $4, description = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [
        type || record[0].type,
        category || record[0].category,
        amount || record[0].amount,
        currency || record[0].currency,
        description || record[0].description,
        status || record[0].status,
        recordId
      ]
    );

    // Логируем действие
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        session.user.id,
        'Обновление финансовой записи',
        JSON.stringify({ recordId, type, category, amount })
      ]
    );

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Ошибка при обновлении финансовой записи:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE: Удаление финансовой записи
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const recordId = params.id;

    // Получаем текущую запись с проверкой доступа
    const record = await query<FinanceRecord>(
      `SELECT fr.* FROM finance_records fr
       JOIN company_users cu ON fr.company_id = cu.company_id
       WHERE fr.id = $1 AND cu.user_id = $2`,
      [recordId, session.user.id]
    );

    if (!record.length) {
      return NextResponse.json({ error: 'Запись не найдена или нет доступа' }, { status: 404 });
    }

    // Удаляем запись
    await query('DELETE FROM finance_records WHERE id = $1', [recordId]);

    // Логируем действие
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        session.user.id,
        'Удаление финансовой записи',
        JSON.stringify({ recordId, type: record[0].type, category: record[0].category })
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении финансовой записи:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const companyId = params.id;
    const { type, category, amount, currency, description } = await request.json();

    // Проверяем доступ пользователя к компании
    const userAccess = await query(
      `SELECT role FROM company_users WHERE company_id = $1 AND user_id = $2`,
      [companyId, session.user.id]
    );

    if (!userAccess.length) {
      return NextResponse.json({ error: 'Нет доступа к компании' }, { status: 403 });
    }

    // Создаем новую финансовую запись
    const result = await query(
      `INSERT INTO finance_records (company_id, type, category, amount, currency, description, author_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [companyId, type, category, amount, currency, description, session.user.id]
    );

    // Логируем действие
    await query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        session.user.id,
        'Создание финансовой записи',
        JSON.stringify({ companyId, type, category, amount })
      ]
    );

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Ошибка при создании финансовой записи:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 