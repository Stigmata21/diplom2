import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await query(
      'SELECT id, username, email, role, avatar_url FROM users WHERE id = $1',
      [session.user.id]
    );
    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const updates: Record<string, any> = {};
    const email = formData.get('email');
    const username = formData.get('username');
    const avatarFile = formData.get('avatar') as File | null;
    console.log('PUT /api/profile avatarFile:', avatarFile);
    let avatar_url = null;
    if (avatarFile) {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${uuidv4()}-${avatarFile.name}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      console.log('Saving avatar to:', path);
      await writeFile(path, buffer);
      avatar_url = `/uploads/${filename}`;
      updates.avatar_url = avatar_url;
      console.log('avatar_url to save:', avatar_url);
    }
    if (email) updates.email = email;
    if (username) updates.username = username;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
    }
    // Формируем динамический SQL
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(updates);
    values.push(session.user.id);
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING id, username, email, role, avatar_url`,
      values
    );
    console.log('User update result:', result[0]);
    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 