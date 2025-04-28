import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

interface User {
    id: number;
    email: string;
    password: string;
    role: string;
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const result = await query<User>(
            'SELECT id, email, password, role FROM users WHERE email = $1',
            [email]
        );

        if (result.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 