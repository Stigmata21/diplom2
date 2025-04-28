// src/app/api/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('Logout requested');
    const response = NextResponse.json({ message: 'Выход успешен' }, { status: 200 });
    response.cookies.delete('token');
    return response;
}