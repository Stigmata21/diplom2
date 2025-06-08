import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';
import { query } from '@/lib/db';

// Определяем типы для данных из БД
interface CompanyUser {
  role_in_company: string;
}

interface FinanceRecord {
  id: string;
  company_id: string;
  author_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CategoryItem {
  category: string;
}

interface FinanceTotals {
  total_income: number;
  total_expense: number;
}

interface User {
  username: string;
}

// GET: Получение финансовых записей компании
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json({ error: 'ID компании не указан' }, { status: 400 });
    }

    // Проверка доступа пользователя к компании
    const companies = await query<CompanyUser>(
      'SELECT cu.role_in_company FROM company_users cu WHERE cu.user_id = $1 AND cu.company_id = $2',
      [session.user.id, companyId]
    );

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Нет доступа к данной компании' }, { status: 403 });
    }

    // Получаем фильтры из запроса
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Строим базовый SQL-запрос
    let sql = `
      SELECT fr.*, u.username as author_name
      FROM finance_records fr
      JOIN users u ON fr.author_id = u.id
      WHERE fr.company_id = $1
    `;
    
    // Параметры для SQL-запроса
    const params: any[] = [companyId];
    let paramIndex = 2;
    
    // Добавляем условия фильтрации
    if (type) {
      sql += ` AND fr.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (category) {
      sql += ` AND fr.category = $${paramIndex++}`;
      params.push(category);
    }
    
    if (status) {
      sql += ` AND fr.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (from) {
      sql += ` AND fr.created_at >= $${paramIndex++}`;
      params.push(from);
    }
    
    if (to) {
      sql += ` AND fr.created_at <= $${paramIndex++}`;
      params.push(to + ' 23:59:59');
    }
    
    sql += ` ORDER BY fr.created_at DESC`;
    
    // Пробуем создать таблицу, если она не существует
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS finance_records (
          id SERIAL PRIMARY KEY,
          company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          type VARCHAR(16) NOT NULL CHECK (type IN ('income', 'expense')),
          category VARCHAR(64) NOT NULL,
          amount NUMERIC(15, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
          description TEXT,
          status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    } catch (e) {
      console.error('Ошибка при создании таблицы:', e);
    }
    
    // Выполняем запрос
    const records = await query<any>(sql, params);

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Ошибка при получении финансовых записей:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Создание новой финансовой записи
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await req.json();
    const { companyId, type, category, amount, currency, description } = data;

    // Проверка обязательных полей
    if (!companyId || !type || !category || !amount) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    // Проверка доступа пользователя к компании
    const companies = await query<CompanyUser>(
      'SELECT cu.role_in_company FROM company_users cu WHERE cu.user_id = $1 AND cu.company_id = $2',
      [session.user.id, companyId]
    );

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Нет доступа к данной компании' }, { status: 403 });
    }

    // Определяем статус записи в зависимости от роли пользователя
    const userRole = companies[0].role_in_company;
    const status = userRole === 'owner' || userRole === 'admin' ? 'approved' : 'pending';

    // Создаем новую запись
    const result = await query<FinanceRecord>(`
      INSERT INTO finance_records (company_id, author_id, type, category, amount, currency, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [companyId, session.user.id, type, category, amount, currency || 'RUB', description || '', status]);

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        companyId, 
        session.user.id, 
        `Создание финансовой записи (${type})`,
        JSON.stringify({ category, amount, currency })
      ]
    );

    // Добавляем имя автора для ответа
    const users = await query<{username: string}>('SELECT username FROM users WHERE id = $1', [session.user.id]);
    const author_name = users.length > 0 ? users[0].username : 'Неизвестный пользователь';
    
    const record = { ...result[0], author_name };

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Ошибка при создании финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 