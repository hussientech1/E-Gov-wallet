-- Debug script for admin login issues
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if admin_users table exists and has data
SELECT 'Admin Users Table Data:' as debug_step;
SELECT * FROM public.admin_users;

-- 2. Check RLS policies on admin_users table
SELECT 'RLS Policies on admin_users:' as debug_step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admin_users';

-- 3. Check if RLS is enabled
SELECT 'RLS Status:' as debug_step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';

-- 4. Test direct query without RLS (as superuser)
SELECT 'Direct Query Test:' as debug_step;
SET row_security = off;
SELECT username, full_name, is_active FROM public.admin_users WHERE username = 'admin';
SET row_security = on;

-- 5. Test the exact query used by the app
SELECT 'App Query Test:' as debug_step;
SELECT * FROM public.admin_users 
WHERE username = 'admin' 
AND password = 'admin123' 
AND is_active = true;

-- 6. Check current user and settings
SELECT 'Current Settings:' as debug_step;
SELECT current_user, current_setting('app.is_admin', true) as is_admin_setting;