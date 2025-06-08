import { NextRequest } from 'next/server';
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
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id;
    
    // Получаем запись
    const result = await query<FinanceRecord>(
      'SELECT * FROM finance_records WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/companies/finance/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT: Обновление финансовой записи
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id;
    const data = await req.json();

    // Обновляем запись
    const result = await query<FinanceRecord>(
      'UPDATE finance_records SET type = $1, category = $2, amount = $3, currency = $4, description = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [data.type, data.category, data.amount, data.currency, data.description, id]
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in PUT /api/companies/finance/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Удаление финансовой записи
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = context.params.id;

    // Удаляем запись
    const result = await query<FinanceRecord>(
      'DELETE FROM finance_records WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Record deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/companies/finance/[id]:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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