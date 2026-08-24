import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
      'Check that your .env file is in the project root and Vite has access to it.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key'
);

export type UserRole = 'admin' | 'sales';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  price: number;
  cost: number;
  is_active: boolean;
  created_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  course_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  course?: Course | null;
  assignee?: Profile | null;
}
