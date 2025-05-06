import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Маркер для отладки запросов
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Пробуем получить тарифы из базы данных
    const plans = await query<{
      id: number;
      name: string;
      price: number;
      description: string;
      max_companies: number;
      max_users: number;
      features: any;
    }>('SELECT * FROM plans');
    
    // Если тарифов нет в базе или доступ к базе отключен, возвращаем тестовые данные
    if (!plans || plans.length === 0) {
      const mockPlans = [
        {
          id: 1,
          name: "Free",
          price: 0,
          description: "Для небольших команд или персонального использования",
          max_companies: 1,
          max_users: 5,
          features: {
            companies: 1,
            employees: 5,
            reports: "Базовые отчеты"
          }
        },
        {
          id: 2,
          name: "Pro",
          price: 1500,
          description: "Для растущих компаний с более сложными потребностями",
          max_companies: 3,
          max_users: 20,
          features: {
            companies: 3,
            employees: 20,
            reports: "Расширенные отчеты",
            notes: "Неограниченные заметки"
          }
        },
        {
          id: 3,
          name: "Enterprise",
          price: 5000,
          description: "Полный набор функций для крупных предприятий",
          max_companies: "Неограниченно",
          max_users: "Неограниченно",
          features: {
            companies: "Неограниченно",
            employees: "Неограниченно",
            reports: "Полная аналитика",
            notes: "Приоритетная поддержка",
            analytics: "Расширенная аналитика"
          }
        }
      ];
      
      return NextResponse.json(mockPlans);
    }
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Ошибка при получении тарифов:', error);
    
    // В случае ошибки возвращаем тестовые данные
    const fallbackPlans = [
      {
        id: 1,
        name: "Free",
        price: 0,
        description: "Для небольших команд или персонального использования",
        max_companies: 1,
        max_users: 5,
        features: {
          companies: 1,
          employees: 5,
          reports: "Базовые отчеты"
        }
      },
      {
        id: 2,
        name: "Pro",
        price: 1500,
        description: "Для растущих компаний с более сложными потребностями",
        max_companies: 3,
        max_users: 20,
        features: {
          companies: 3,
          employees: 20,
          reports: "Расширенные отчеты",
          notes: "Неограниченные заметки"
        }
      },
      {
        id: 3,
        name: "Enterprise",
        price: 5000,
        description: "Полный набор функций для крупных предприятий",
        max_companies: "Неограниченно",
        max_users: "Неограниченно",
        features: {
          companies: "Неограниченно",
          employees: "Неограниченно",
          reports: "Полная аналитика",
          notes: "Приоритетная поддержка",
          analytics: "Расширенная аналитика"
        }
      }
    ];
    
    return NextResponse.json(fallbackPlans);
  }
} 