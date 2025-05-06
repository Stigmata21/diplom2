import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

// PUT /api/companies/[companyId]/employees/[employeeId]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
  const params = await context.params;
  const { companyId, employeeId } = params;
  const { name, email, role, salary, note } = await req.json();
  if (!companyId || !employeeId) return NextResponse.json({ error: 'companyId, employeeId обязательны' }, { status: 400 });
  try {
    // Обновить пользователя
    await query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [name, email, employeeId]);
    // Обновить связь в company_users
    await query('UPDATE company_users SET role_in_company = $1, salary = $2, note = $3 WHERE company_id = $4 AND user_id = $5', [role, salary, note, companyId, employeeId]);
    // Логируем изменение сотрудника
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, session.user.id, 'update_employee', JSON.stringify({ employeeId, name, email, role, salary, note })]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка обновления сотрудника' }, { status: 500 });
  }
}

// DELETE /api/companies/[companyId]/employees/[employeeId]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
  const params = await context.params;
  const { companyId, employeeId } = params;
  if (!companyId || !employeeId) return NextResponse.json({ error: 'companyId, employeeId обязательны' }, { status: 400 });
  try {
    await query('DELETE FROM company_users WHERE company_id = $1 AND user_id = $2', [companyId, employeeId]);
    // Логируем удаление сотрудника
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await query('INSERT INTO company_logs (company_id, user_id, action, meta) VALUES ($1, $2, $3, $4)', [companyId, session.user.id, 'remove_employee', JSON.stringify({ employeeId })]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка удаления сотрудника' }, { status: 500 });
  }
} 