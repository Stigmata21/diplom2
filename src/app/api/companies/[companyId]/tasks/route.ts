import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/companies/[companyId]/tasks
export async function GET(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  if (!companyId) return NextResponse.json({ error: 'companyId обязателен' }, { status: 400 });
  try {
    const tasks = await query<any>(
      `SELECT t.id, t.title, t.description, t.status, t.assignee_id, u.username as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.company_id = $1
       ORDER BY t.created_at DESC`,
      [companyId]
    );
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка получения задач' }, { status: 500 });
  }
}

// POST /api/companies/[companyId]/tasks
export async function POST(req: NextRequest, { params }: { params: { companyId: string } }) {
  const { companyId } = await params;
  const { title, description, status, assignee_id } = await req.json();
  if (!companyId || !title) return NextResponse.json({ error: 'companyId и title обязательны' }, { status: 400 });
  try {
    const result = await query<any>(
      `INSERT INTO tasks (company_id, title, description, status, assignee_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [companyId, title, description || '', status || 'open', assignee_id || null]
    );
    return NextResponse.json({ task: result[0] }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Ошибка создания задачи' }, { status: 500 });
  }
} 