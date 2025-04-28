// src/app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '../../../lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.id as string;

        const result = await query(
            'SELECT id, username, email, role, avatar_url FROM users WHERE id = $1',
            [userId]
        );

        if (result.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = result[0];
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}