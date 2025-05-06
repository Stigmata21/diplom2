// Используем динамический импорт для избежания проблем на клиенте
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
type PoolType = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Pool: any = class MockPool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(): Promise<{ rows: any[] }> {
    return { rows: [] };
  }
};

// Если мы на сервере, пробуем импортировать pg
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pg = require('pg');
    Pool = pg.Pool;
  } catch {
    // Ничего не делаем, уже установлена заглушка
  }
}

// Определяем, нужно ли пропускать запросы к БД
// Во время разработки и обычной работы не пропускаем запросы (только при сборке и на клиенте)
const shouldSkipDbQuery = 
  (process.env.NEXT_SKIP_DB_QUERY === 'true' && process.env.NODE_ENV === 'production') || 
  process.env.NEXT_PHASE === 'phase-production-build' ||
  typeof window !== 'undefined'; // Пропускаем только в браузере

// Определяем, нужно ли использовать SSL - отключаем для локальной разработки и WebSocket сервера
const useSSL = process.env.DATABASE_SSL !== 'false' && 
               process.env.NODE_ENV !== 'development' && 
               !process.argv.includes('support-ws-server.ts');

// Создаем пул только если не пропускаем запросы
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null;

// Инициализируем пул только если не в режиме сборки и не на клиенте
if (!shouldSkipDbQuery) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false
    });
    console.log('Database pool initialized with SSL:', useSSL);
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    pool = null;
  }
}

export type QueryParam = string | number | boolean | null;

export async function query<T>(text: string, params?: QueryParam[]): Promise<T[]> {
  try {
    // При сборке или если пропускаем запросы к БД, возвращаем пустой массив
    if (shouldSkipDbQuery) {
      console.log('Database query skipped (client-side or build):', text);
      return [] as T[];
    }
    
    if (!pool) {
      console.log('Database pool not initialized, returning empty result');
      return [] as T[];
    }
    
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [] as T[];
  }
}

export async function logAdminAction(userId: string | number | null, action: string, details: unknown = null) {
  // Пропускаем логирование при сборке или на клиенте
  if (shouldSkipDbQuery) {
    console.log('Admin action logging skipped:', action);
    return;
  }
  
  try {
    await query(
      'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, action, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
} 