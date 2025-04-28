// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

interface CompanyInsertResult {
    id: number;
}

interface Company {
    id: number;
    name: string;
    description: string;
    role_in_company: string;
    created_at: string;
    updated_at: string;
}

interface CompanyResponse {
    company?: Company;
    message?: string;
    error?: string;
}

interface DeleteResponse {
    message?: string;
    error?: string;
}

interface CompanyMember {
    role: string;
}

const companySchema = z.object({
    name: z.string().min(2).max(64),
    description: z.string().max(256).optional(),
    role: z.string().min(2).max(32).optional(),
});

const updateCompanySchema = z.object({
    companyId: z.number(),
    name: z.string().min(2).max(64),
    description: z.string().max(256).optional(),
    role: z.string().min(2).max(32).optional(),
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function getUserIdFromToken(request: NextRequest): Promise<number | null> {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    return decoded.id;
}

export async function GET(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.id as string;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        let sql = `
            SELECT c.*, cm.role as user_role 
            FROM companies c
            JOIN company_members cm ON c.id = cm.company_id
            WHERE cm.user_id = $1
        `;
        const params: (string | number)[] = [userId];

        if (search) {
            sql += ` AND c.name ILIKE $${params.length + 1}`;
            params.push(`%${search}%`);
        }

        if (role) {
            sql += ` AND cm.role = $${params.length + 1}`;
            params.push(role);
        }

        sql += ' ORDER BY c.created_at DESC';

        const companies = await query<Company>(sql, params);
        const total = companies.length;

        return NextResponse.json({ companies, total });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.id as string;

        const { name, description, role } = await request.json();

        if (!name || !description || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await query<Company>(
            `INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description]
        );

        const company = result[0];

        await query(
            `INSERT INTO company_members (company_id, user_id, role) VALUES ($1, $2, $3)`,
            [company.id, userId, role]
        );

        return NextResponse.json({ 
            company,
            message: 'Company created successfully'
        });
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.id as string;

        const { companyId, name, description, role } = await request.json();

        if (!companyId || !name || !description || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const member = await query<CompanyMember>(
            `SELECT role FROM company_members WHERE company_id = $1 AND user_id = $2`,
            [companyId, userId]
        );

        if (!member.length || member[0].role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const result = await query<Company>(
            `UPDATE companies SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
            [name, description, companyId]
        );

        const company = result[0];

        return NextResponse.json({ 
            company,
            message: 'Company updated successfully'
        });
    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.id as string;

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }

        const member = await query<CompanyMember>(
            `SELECT role FROM company_members WHERE company_id = $1 AND user_id = $2`,
            [companyId, userId]
        );

        if (!member.length || member[0].role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await query(
            `DELETE FROM company_members WHERE company_id = $1`,
            [companyId]
        );

        await query(
            `DELETE FROM companies WHERE id = $1`,
            [companyId]
        );

        return NextResponse.json({ 
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}