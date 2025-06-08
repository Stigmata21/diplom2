import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/authOptions';
import { query } from '@/lib/db';

// Types
interface FinanceRecord {
  id: string;
  company_id: string;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
  amount: number;
  type: 'income' | 'expense';
}

interface CompanyUser {
  role_in_company: string;
}

// PUT: Обновление статуса финансовой записи
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
    const { status } = await req.json();

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 });
    }

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

    // Проверяем права на изменение статуса (только админ или владелец)
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Нет прав на изменение статуса записи' }, { status: 403 });
    }

    // Обновляем статус записи
    const result = await query<any>(
      `UPDATE finance_records
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, recordId]
    );

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        record.company_id, 
        session.user.id, 
        `${status === 'approved' ? 'Подтверждение' : status === 'rejected' ? 'Отклонение' : 'Изменение статуса'} финансовой записи`, 
        JSON.stringify({ recordId, status, type: record.type, amount: record.amount })
      ]
    );

    // Добавляем имя автора для ответа
    const users = await query<{username: string}>('SELECT username FROM users WHERE id = $1', [record.author_id]);
    const author_name = users.length > 0 ? users[0].username : 'Неизвестный пользователь';
    
    const updatedRecord = { ...result[0], author_name };

    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    console.error('Ошибка при изменении статуса финансовой записи:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 