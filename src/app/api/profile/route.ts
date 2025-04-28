import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface UserResult {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

async function getUserIdFromRequest(req: Request): Promise<number | null> {
  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const result = await query<UserResult>('SELECT id FROM users WHERE email = $1', [session.user.email]);
    return result[0]?.id || null;
  }

  // Try JWT token
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (token) {
    const decoded = verifyToken(token);
    return decoded?.id || null;
  }

  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await query<UserResult>(
      'SELECT id, username, email, role, avatar_url FROM users WHERE email = $1',
      [session.user.email]
    );
    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const avatarFile = formData.get('avatar') as File | null;

    let avatar_url = null;
    if (avatarFile) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${uuidv4()}-${avatarFile.name}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
      avatar_url = `/uploads/${filename}`;
    }

    const result = await query<UserResult>(
      'UPDATE users SET email = $1, username = $2, avatar_url = COALESCE($3, avatar_url) WHERE id = $4 RETURNING id, username, email, role, avatar_url',
      [email, username, avatar_url, userId]
    );

    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 