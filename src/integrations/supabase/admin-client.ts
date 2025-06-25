
import { createClient } from '@supabase/supabase-js';

// Create a custom client for admin functions that includes the admin_users and admin_logs tables
// This avoids TypeScript errors when accessing tables not in the auto-generated types.ts

const SUPABASE_URL = "https://tzihqfnkuyfgsjpetfzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWhxZm5rdXlmZ3NqcGV0ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzYzNjUsImV4cCI6MjA2MDMxMjM2NX0.aFvEeLvuOJ--JoRITqsKeety96Qcvl46aT1rHL1A7Ko";

export const adminSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface AdminLog {
  log_id: number;
  admin_username: string;
  action: string;
  ip_address: string;
  created_at: string;
}

export interface AdminUser {
  admin_id: number;
  username: string;
  password: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}
