-- Manual script to create admin user
-- Run this directly in Supabase SQL Editor

-- First, check if admin_users table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'admin_users';

-- Insert admin user directly
INSERT INTO public.admin_users (username, password, full_name, is_active)
VALUES ('admin', 'admin123', 'System Administrator', true);

-- Insert test admin user
INSERT INTO public.admin_users (username, password, full_name, is_active)
VALUES ('testadmin', 'password123', 'Test Administrator', true);

-- Check if users were created
SELECT * FROM public.admin_users;

-- Log the creation
INSERT INTO public.admin_logs (admin_username, action, ip_address)
VALUES 
  ('system', 'Created default admin user: admin', '127.0.0.1'),
  ('system', 'Created default admin user: testadmin', '127.0.0.1');