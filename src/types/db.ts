export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Employee {
  id: string;
  user_id: string;
  company_id: string;
  role: 'owner' | 'admin' | 'employee';
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
} 