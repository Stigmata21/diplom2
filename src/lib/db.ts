import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export type QueryParam = string | number | boolean | null;

export async function query<T>(text: string, params?: QueryParam[]): Promise<T[]> {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

export async function logAdminAction(userId: string | number | null, action: string, details: unknown = null) {
  await query(
    'INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)',
    [userId, action, details ? JSON.stringify(details) : null]
  );
} 