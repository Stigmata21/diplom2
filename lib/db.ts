// lib/db.ts
import { Pool } from 'pg';

// Тип для параметров запроса
type QueryParam = string | number | boolean | Date | null;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query<T>(text: string, params?: QueryParam[]): Promise<T[]> {
    try {
        const result = await pool.query(text, params);
        return result.rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export default pool;