// Типы для компаний

export type CompanyRole = 'owner' | 'admin' | 'member';

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: CompanyRole;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  employees_count?: number;
  user_role: CompanyRole;
  users?: CompanyUser[];
}

export interface CompanyInvite {
  id: string;
  company_id: string;
  email: string;
  role: CompanyRole;
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  created_at: string;
} 