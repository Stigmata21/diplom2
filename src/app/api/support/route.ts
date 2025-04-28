// src/app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request: NextRequest) {
    try {
        const { userId, message } = await request.json();

        if (!userId || !message) {
            return NextResponse.json({ error: 'Необходимы userId и сообщение' }, { status: 400 });
        }

        await query(
            'INSERT INTO support_messages (user_id, message) VALUES ($1, $2)',
            [userId, message]
        );

        return NextResponse.json({ message: 'Сообщение отправлено в поддержку' }, { status: 200 });
    } catch (error) {
        console.error('Support request error:', error);
        return NextResponse.json({ error: 'Ошибка при отправке сообщения' }, { status: 500 });
    }
}