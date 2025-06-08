import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
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

// GET: Получение отдельной финансовой записи
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем доступ пользователя к компании
    const userAccessResult = await query<UserAccess>(
      'SELECT role FROM company_users WHERE user_id = $1 AND company_id = (SELECT company_id FROM finance WHERE id = $2)',
      [session.user.id, id]
    );

    if (userAccessResult.rowCount === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Получаем финансовую запись
    const financeResult = await query<FinanceRecord>(
      'SELECT * FROM finance WHERE id = $1',
      [id]
    );

    if (financeResult.rowCount === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    return NextResponse.json(financeResult.rows[0]);
  } catch (error) {
    console.error('Error in GET /api/companies/finance/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Обновление финансовой записи
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Проверяем доступ пользователя к компании
    const userAccessResult = await query<CompanyUser>(
      'SELECT role_in_company FROM company_users WHERE user_id = $1 AND company_id = (SELECT company_id FROM finance WHERE id = $2)',
      [session.user.id, id]
    );

    if (userAccessResult.rowCount === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userRole = userAccessResult.rows[0].role_in_company;
    if (!['owner', 'admin', 'accountant'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Обновляем финансовую запись
    const result = await query<FinanceRecord>(
      'UPDATE finance SET type = $1, category = $2, amount = $3, currency = $4, description = $5, status = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [
        body.type,
        body.category,
        body.amount,
        body.currency,
        body.description,
        body.status,
        id
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error in PUT /api/companies/finance/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Удаление финансовой записи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем доступ пользователя к компании
    const userAccessResult = await query<CompanyUser>(
      'SELECT role_in_company FROM company_users WHERE user_id = $1 AND company_id = (SELECT company_id FROM finance WHERE id = $2)',
      [session.user.id, id]
    );

    if (userAccessResult.rowCount === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userRole = userAccessResult.rows[0].role_in_company;
    if (!['owner', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Удаляем финансовую запись
    const result = await query<FinanceRecord>(
      'DELETE FROM finance WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error in DELETE /api/companies/finance/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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