import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from "uuid";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";

// Определяем типы для данных из БД
interface CompanyUser {
  role_in_company: string;
}

interface FinancialReport {
  id: string;
  company_id: string;
  author_id: string;
  title: string;
  period: string;
  type: string;
  data: Record<string, any>;
  created_at: string;
  status: string;
  file_url?: string;
}

interface User {
  username: string;
}

// GET: Получение отчетов компании
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

    // Получаем отчеты
    const reports = await query<FinancialReport & { author_name: string }>(`
      SELECT fr.*, u.username as author_name
      FROM financial_reports fr
      JOIN users u ON fr.author_id = u.id
      WHERE fr.company_id = $1
      ORDER BY fr.created_at DESC
    `, [companyId]);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Ошибка при получении финансовых отчетов:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Создание нового отчета
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await req.json(); console.log("Debug - request body:", data);
    const { companyId, title, period, type, data: reportFromData, reportData: reportFromReportData } = data;
    const reportData = reportFromData || reportFromReportData;
    if (!reportData) {
      console.log("Debug - no report data found in request");
    }

    // Логирование для отладки
    console.log('Полученные данные отчета:', { 
      companyId, 
      title, 
      period, 
      type, 
      reportData
    });

    if (!companyId || !title || !type) {
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

    const userRole = companies[0].role_in_company;
    let fileUrl = null;
    
    // Проверяем наличие таблицы, создаем если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS financial_reports (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(128) NOT NULL,
        period VARCHAR(64) NOT NULL,
        type VARCHAR(32) NOT NULL,
        data JSONB NOT NULL,
        file_url VARCHAR(255),
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Подготавливаем данные отчета
    let processedReportData = reportData;
    
    // Если данные не пришли от клиента, подготовим базовые данные
    if (!processedReportData || Object.keys(processedReportData || {}).length === 0) {
      try {
        // Получаем финансовые данные компании (проверяем существование таблицы)
        const tablesExist = await query<{ exists: boolean }>(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'financial_transactions'
          );
        `);
        
        if (tablesExist[0].exists) {
          const financeRecords = await query(`
            SELECT * FROM financial_transactions 
            WHERE company_id = $1 AND status = 'approved'`,
            [companyId]
          );
          
          console.log(`Получено ${financeRecords.length} одобренных транзакций для отчета`);
          
          // В зависимости от типа отчета используем разную логику обработки данных
          console.log('Тип отчета:', type);
          
          if (type === 'Годовой') {
            // Для годового отчета используем специальную функцию
            processedReportData = await generateYearlyReportData(companyId, financeRecords);
          } else if (type === 'Квартальный') {
            // Для квартального отчета
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
            
            // Фильтруем транзакции за текущий квартал
            const startQuarterMonth = (currentQuarter - 1) * 3;
            const endQuarterMonth = startQuarterMonth + 3;
            
            console.log(`Текущий квартал: Q${currentQuarter} (месяцы: ${startQuarterMonth+1}-${endQuarterMonth})`);
            
            const quarterRecords = financeRecords.filter((record: any) => {
              const recordDate = new Date(record.created_at);
              const recordMonth = recordDate.getMonth();
              return recordDate.getFullYear() === currentYear && 
                recordMonth >= startQuarterMonth && 
                recordMonth < endQuarterMonth;
            });
            
            console.log(`Отфильтровано ${quarterRecords.length} транзакций за текущий квартал`);
            
            // Если есть записи за текущий квартал, используем их, иначе все записи
            const recordsToUse = quarterRecords.length > 0 ? quarterRecords : financeRecords;
            
            const income = recordsToUse
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = parseFloat(r.amount?.toString() || '0') || 0;
                console.log(`Доход Q${currentQuarter} (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
                return sum + amount;
              }, 0);
              
            const expenses = recordsToUse
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = parseFloat(r.amount?.toString() || '0') || 0;
                console.log(`Расход Q${currentQuarter} (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
                return sum + amount;
              }, 0);
            
            const profit = income - expenses;
            
            console.log(`Финансовые показатели за Q${currentQuarter}:
              Доходы: ${income} ₽
              Расходы: ${expenses} ₽
              Прибыль: ${profit} ₽`);
            
            processedReportData = {
              income,
              expenses,
              profit,
              quarter: currentQuarter,
              year: currentYear,
              generatedAt: new Date().toISOString()
            };
          } else {
            // Для других типов отчетов используем базовую логику
            const income = financeRecords
              .filter((r: any) => r.type === 'income')
              .reduce((sum: number, r: any) => {
                const amount = parseFloat(r.amount?.toString() || '0') || 0;
                console.log(`Доход (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
                return sum + amount;
              }, 0);
              
            const expenses = financeRecords
              .filter((r: any) => r.type === 'expense')
              .reduce((sum: number, r: any) => {
                const amount = parseFloat(r.amount?.toString() || '0') || 0;
                console.log(`Расход (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
                return sum + amount;
              }, 0);
            
            const profit = income - expenses;
            
            console.log(`Финансовые показатели:
              Доходы: ${income} ₽
              Расходы: ${expenses} ₽
              Прибыль: ${profit} ₽`);
            
            processedReportData = {
              income,
              expenses,
              profit,
              generatedAt: new Date().toISOString()
            };
          }
        } else {
          // Если таблица не существует, создаем пустые данные
          processedReportData = {
            income: 0,
            expenses: 0,
            profit: 0,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('Ошибка при получении финансовых данных:', error);
        // Создаем пустые данные в случае ошибки
        processedReportData = {
          income: 0,
          expenses: 0,
          profit: 0,
          generatedAt: new Date().toISOString()
        };
      }
    }
    
    // Проверка числовых значений и преобразование
    if (processedReportData) {
      // Убедимся, что финансовые показатели - числа
      if (processedReportData.income !== undefined) {
        processedReportData.income = Number(processedReportData.income);
      }
      if (processedReportData.expenses !== undefined) {
        processedReportData.expenses = Number(processedReportData.expenses);
      }
      if (processedReportData.profit !== undefined) {
        processedReportData.profit = Number(processedReportData.profit);
      }

      console.log('Финальные данные отчета:', processedReportData);
    }
    
    // Преобразуем объект в строку JSON, если это не строка
    const jsonData = typeof processedReportData === 'string' 
      ? processedReportData 
      : JSON.stringify(processedReportData || {});
    
    // Генерируем HTML-файл для отчета, если это запрошено
    if (data.generateFile) {
      // Путь для хранения отчетов
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
      
      // Создаем директорию, если не существует
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Уникальное имя файла
      const fileName = `report_${companyId}_${uuidv4()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Форматируем данные для отчета
      const parsedData = typeof processedReportData === 'string' 
        ? JSON.parse(processedReportData) 
        : processedReportData || {};
      
      const income = parsedData?.income 
        ? Number(parsedData.income).toLocaleString('ru-RU') + ' ₽' 
        : '0 ₽';
      const expenses = parsedData?.expenses 
        ? Number(parsedData.expenses).toLocaleString('ru-RU') + ' ₽' 
        : '0 ₽';
      const profit = parsedData?.profit 
        ? Number(parsedData.profit).toLocaleString('ru-RU') + ' ₽' 
        : '0 ₽';
      
      // Получаем название компании
      const companyResult = await query<{ name: string }>(`SELECT name FROM companies WHERE id = $1`, [companyId]);
      const companyName = companyResult.length > 0 ? companyResult[0].name : 'Неизвестная компания';
      
      // Получаем имя автора
      const users = await query<User>('SELECT username FROM users WHERE id = $1', [session.user.id]);
      const authorName = users.length > 0 ? users[0].username : 'Неизвестный пользователь';
      
      // Дополнительная информация для годового отчета
      let additionalContent = '';
      if (type === 'Годовой') {
        const monthsCovered = parsedData.monthsCovered || 0;
        
        additionalContent = `
        <h2>Дополнительная информация</h2>
        <div class="finance-card">
          <div class="info-row"><strong>Текущий период:</strong> ${monthsCovered} мес. из 12</div>
          <div class="info-row"><strong>Представлены данные за:</strong> ${monthsCovered} ${monthsCovered === 1 ? 'месяц' : monthsCovered < 5 ? 'месяца' : 'месяцев'}</div>
        </div>`;
      }
      
      // Создаем HTML-документ для отчета
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Финансовый отчет</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.5;
          }
          h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
          }
          h2 {
            font-size: 18px;
            margin: 30px 0 15px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
            color: #2980b9;
          }
          h3 {
            font-size: 16px;
            margin: 20px 0 10px 0;
            color: #2980b9;
          }
          .info-row {
            margin-bottom: 10px;
          }
          .info-row strong {
            font-weight: bold;
          }
          .finance-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .income {
            color: #27ae60;
            font-weight: bold;
          }
          .expense {
            color: #c0392b;
            font-weight: bold;
          }
          .profit {
            color: #2980b9;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
          }
          .finance-card {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <h1>Финансовый отчет</h1>
        
        <div class="finance-card">
          <div class="info-row"><strong>Название:</strong> ${title}</div>
          <div class="info-row"><strong>Тип:</strong> ${type}</div>
          <div class="info-row"><strong>Период:</strong> ${period || 'Не указан'}</div>
          <div class="info-row"><strong>Компания:</strong> ${companyName}</div>
          <div class="info-row"><strong>Автор:</strong> ${authorName}</div>
          <div class="info-row"><strong>Дата создания:</strong> ${new Date().toLocaleDateString('ru-RU')}</div>
        </div>
        
        <h2>Финансовые показатели</h2>
        
        <div class="finance-card">
          <div class="finance-row">
            <div><strong>Доходы:</strong></div>
            <div class="income">${income}</div>
          </div>
          
          <div class="finance-row">
            <div><strong>Расходы:</strong></div>
            <div class="expense">${expenses}</div>
          </div>
          
          <div class="finance-row">
            <div><strong>Прибыль:</strong></div>
            <div class="profit">${profit}</div>
          </div>
        </div>
        
        ${additionalContent}
        
        <div class="footer">
          Отчет сформирован: ${new Date().toLocaleString('ru-RU')}
        </div>
      </body>
      </html>`;
      
      try {
        // Сохраняем HTML в файл
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        
        // URL файла для сохранения в БД
        fileUrl = `/uploads/reports/${fileName}`;
      } catch (error) {
        console.error('Ошибка при создании отчета:', error);
        // Если генерация не удалась, продолжаем без файла
      }
    }

    // Создаем отчет
    const result = await query<FinancialReport>(`
      INSERT INTO financial_reports (company_id, author_id, title, period, type, data, file_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [companyId, session.user.id, title, period || '', type, jsonData, fileUrl, 'active']);

    // Логируем действие
    await query(
      `INSERT INTO company_logs (company_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4)`, 
      [
        companyId, 
        session.user.id, 
        'Создание финансового отчета', 
        JSON.stringify({ title, type })
      ]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Не удалось создать отчет' }, { status: 500 });
    }

    // Получаем имя автора для созданного отчета
    const users = await query<User>('SELECT username FROM users WHERE id = $1', [session.user.id]);
    const author_name = users.length > 0 ? users[0].username : 'Неизвестный пользователь';
    
    const report = { ...result[0], author_name };

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Ошибка при создании финансового отчета:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Эта функция будет обрабатывать логику годового отчета
const generateYearlyReportData = async (companyId: string, financeRecords: any[]) => {
  // Текущий год
  const currentYear = new Date().getFullYear();
  
  console.log(`Генерация годового отчета для компании ID ${companyId}, всего записей: ${financeRecords.length}`);
  
  // Фильтруем транзакции только за текущий год для более точных данных
  const thisYearRecords = financeRecords.filter((record: any) => {
    const recordDate = new Date(record.created_at);
    return recordDate.getFullYear() === currentYear;
  });
  
  console.log(`Отфильтровано записей за текущий год (${currentYear}): ${thisYearRecords.length}`);
  
  // Если есть записи за текущий год, используем их
  // Иначе используем все доступные записи
  const recordsToUse = thisYearRecords.length > 0 ? thisYearRecords : financeRecords;
  
  // Расчет доходов и расходов
  const income = recordsToUse
    .filter((r: any) => r.type === 'income')
    .reduce((sum: number, r: any) => {
      const amount = parseFloat(r.amount?.toString() || '0') || 0;
      console.log(`Доход (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
      return sum + amount;
    }, 0);
    
  const expenses = recordsToUse
    .filter((r: any) => r.type === 'expense')
    .reduce((sum: number, r: any) => {
      const amount = parseFloat(r.amount?.toString() || '0') || 0;
      console.log(`Расход (ID: ${r.id}): ${r.category || 'Нет категории'} - ${amount} ₽`);
      return sum + amount;
    }, 0);
  
  const profit = income - expenses;
  
  // Для годового отчета используем реальные данные, но сохраняем информацию 
  // о том, за какой период эти данные получены
  const now = new Date();
  const monthsPassed = now.getMonth() + 1; // +1 потому что месяцы с 0
  
  console.log(`Итоговые финансовые показатели за ${monthsPassed} месяцев ${currentYear} года:
    Доходы: ${income} ₽
    Расходы: ${expenses} ₽
    Прибыль: ${profit} ₽`);
  
  // Возвращаем фактические данные
  return {
    income,
    expenses,
    profit,
    monthsCovered: monthsPassed,
    year: currentYear,
    generatedAt: new Date().toISOString()
  };
};