import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/authOptions';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email;
  const invites = await query<{ id: number; company_id: number; role: string; status: string }>(
    `SELECT i.id, i.company_id, c.name as company_name, i.email, i.role, i.status, i.invited_by, i.created_at
     FROM company_invites i
     JOIN companies c ON i.company_id = c.id
     WHERE i.email = $1
     ORDER BY i.created_at DESC`,
    [email]
  );
  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const email = session.user.email;
  const { inviteId, action } = await request.json();
  if (!inviteId || !['accept','decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  // Проверяем, что инвайт действительно на этого пользователя
  const invites = await query<{ id: number; company_id: number; role: string; status: string }>(
    'SELECT * FROM company_invites WHERE id = $1 AND email = $2',
    [inviteId, email]
  );
  if (!invites.length) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invites[0].status !== 'pending') {
    return NextResponse.json({ error: 'Invite already handled' }, { status: 400 });
  }
  if (action === 'accept') {
    // Добавляем пользователя в компанию
    await query(
      'INSERT INTO company_users (company_id, user_id, role_in_company) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [invites[0].company_id, session.user.id, invites[0].role]
    );
    await query('UPDATE company_invites SET status = $1 WHERE id = $2', ['accepted', inviteId]);
  } else if (action === 'decline') {
    await query('UPDATE company_invites SET status = $1 WHERE id = $2', ['declined', inviteId]);
  }
  return NextResponse.json({ ok: true });
} 