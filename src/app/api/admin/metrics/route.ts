import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { format, addDays } from 'date-fns';

// Эти маркеры нужны для конфигурации маршрута
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Отключаем кеширование

// Функция для генерации всех дат в диапазоне
function generateDateRange(startDateStr: string, endDateStr: string) {
  const dates = [];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    console.log(`Получен запрос метрик с датами: ${startDate} - ${endDate}`);
    
    // Базовый запрос для подсчета пользователей и компаний
    const usersRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    const companiesRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM companies');
    
    // Запрос для подсчета логов с фильтрацией по датам
    let logsQuery = "SELECT COUNT(*) as count FROM logs";
    let logsParams: any[] = [];
    
    let activityQuery = `
      SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as count 
      FROM logs
    `;
    let activityParams: any[] = [];
    
    let dateRange: string[] = [];
    
    // Если указаны даты, добавляем фильтрацию по ним
    if (startDate && endDate) {
      logsQuery += " WHERE created_at BETWEEN $1 AND ($2 || ' 23:59:59')::timestamp";
      logsParams = [startDate, endDate];
      
      activityQuery += " WHERE created_at BETWEEN $1 AND ($2 || ' 23:59:59')::timestamp";
      activityParams = [startDate, endDate];
      
      // Генерируем полный диапазон дат
      dateRange = generateDateRange(startDate, endDate);
    } else {
      // По умолчанию - за последнюю неделю
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
      
      logsQuery += " WHERE created_at BETWEEN $1 AND ($2 || ' 23:59:59')::timestamp";
      logsParams = [weekAgoStr, todayStr];
      
      activityQuery += " WHERE created_at BETWEEN $1 AND ($2 || ' 23:59:59')::timestamp";
      activityParams = [weekAgoStr, todayStr];
      
      // Генерируем полный диапазон дат
      dateRange = generateDateRange(weekAgoStr, todayStr);
    }
    
    // Добавляем группировку и сортировку для активности
    activityQuery += " GROUP BY day ORDER BY day";
    
    const logsRes = await query<{ count: string }>(logsQuery, logsParams);
    const activityRaw = await query<{ day: string, count: string }>(activityQuery, activityParams);
    
    // Формируем полный набор данных активности со всеми датами
    const activityMap = new Map(activityRaw.map(item => [item.day, parseInt(item.count, 10)]));
    const activity = dateRange.map(day => ({
      day,
      count: activityMap.get(day) || 0
    }));
    
    // Подсчитываем общее количество логов из активности
    const totalLogsFromActivity = activity.reduce((sum, item) => sum + item.count, 0);
    
    console.log(`Найдено ${totalLogsFromActivity} логов по дням и ${activity.length} дней активности`);
    
    return NextResponse.json({
      users: parseInt(usersRes[0]?.count || '0', 10),
      companies: parseInt(companiesRes[0]?.count || '0', 10),
      logs: totalLogsFromActivity,
      activity: activity
    });
  } catch (e: unknown) {
    console.error('Ошибка при получении метрик:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
} 