// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

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
    role_in_company: string;
}

const companySchema = z.object({
    name: z.string().min(2).max(64),
    description: z.string().max(256).optional(),
    role_in_company: z.string().min(2).max(32).optional(),
});

const updateCompanySchema = z.object({
    companyId: z.number(),
    name: z.string().min(2).max(64),
    description: z.string().max(256).optional(),
    role_in_company: z.string().min(2).max(32).optional(),
});

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        let sql = `
            SELECT c.*, cu.role_in_company as user_role, 
              (SELECT COUNT(*) FROM company_users cu2 WHERE cu2.company_id = c.id) as employees_count
            FROM companies c
            JOIN company_users cu ON c.id = cu.company_id
            WHERE cu.user_id = $1
        `;
        const params: (string | number)[] = [userId];

        if (search) {
            sql += ` AND c.name ILIKE $${params.length + 1}`;
            params.push(`%${search}%`);
        }

        if (role) {
            sql += ` AND cu.role_in_company = $${params.length + 1}`;
            params.push(role);
        }

        sql += ' ORDER BY c.created_at DESC';

        const companies = await query<Company>(sql, params);
        const companiesWithUsers = await Promise.all(companies.map(async (company) => {
            const users = await query<any>(
                `SELECT u.id, u.username as name, u.email, cu.role_in_company as role
                 FROM company_users cu
                 JOIN users u ON cu.user_id = u.id
                 WHERE cu.company_id = $1
                 ORDER BY cu.role_in_company DESC, u.username ASC`,
                [company.id]
            );
            return { ...company, users };
        }));
        const total = companies.length;

        return NextResponse.json({ companies: companiesWithUsers, total });
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { name, description, role_in_company } = await request.json();

        if (!name || !description || !role_in_company) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await query<Company>(
            `INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description]
        );

        const company = result[0];

        await query(
            `INSERT INTO company_users (company_id, user_id, role_in_company) VALUES ($1, $2, $3)`,
            [company.id, userId, role_in_company]
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { companyId, name, description, role_in_company } = await request.json();

        if (!companyId || !name || !description || !role_in_company) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const member = await query<CompanyMember>(
            `SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2`,
            [companyId, userId]
        );

        if (!member.length || member[0].role_in_company !== 'owner') {
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }

        const member = await query<CompanyMember>(
            `SELECT role_in_company FROM company_users WHERE company_id = $1 AND user_id = $2`,
            [companyId, userId]
        );

        if (!member.length || member[0].role_in_company !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await query(
            `DELETE FROM company_users WHERE company_id = $1`,
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