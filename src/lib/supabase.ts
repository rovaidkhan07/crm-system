import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
  console.warn(
    '⚠️  Supabase URL is not configured. Open .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Use a safe fallback URL so the client doesn't throw during module init
const safeUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey);

export type PipelineStage = 'Lead' | 'Appointment' | 'Qualified' | 'Not Interested' | 'Sold';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  extra_questions: string | null;
  company_size: string | null;
  company_revenue: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  pipeline_stage: PipelineStage;
  amount_paid: number | null;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  created_at: string;
}
