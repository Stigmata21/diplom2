// src/app/api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Необходим userId' }, { status: 400 });
    }

    try {
        const subscriptions = await query(
            `SELECT p.name AS plan_name, s.start_date, s.end_date
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1
       LIMIT 1`,
            [userId]
        );

        if (subscriptions.length > 0) {
            return NextResponse.json({ subscription: subscriptions[0] }, { status: 200 });
        }
        return NextResponse.json({ subscription: null }, { status: 200 });
    } catch (error) {
        console.error('Subscription fetch error:', error);
        return NextResponse.json({ error: 'Ошибка при получении подписки' }, { status: 500 });
    }
}