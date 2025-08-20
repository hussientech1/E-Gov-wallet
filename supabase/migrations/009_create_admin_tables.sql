-- Migration: Create admin tables for managing admin users and logs
-- Date: 2025-01-12
-- Description: Create admin_users and admin_logs tables for admin management

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on username if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'admin_users_username_key'
    ) THEN
        ALTER TABLE public.admin_users
        ADD CONSTRAINT admin_users_username_key UNIQUE (username);
    END IF;
END $$;

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    log_id SERIAL PRIMARY KEY,
    admin_username VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_username ON public.admin_logs(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users table
-- Allow authentication queries (SELECT for login)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy pol
        JOIN pg_class pc ON pc.oid = pol.polrelid
        WHERE pc.relname = 'admin_users' AND pol.polname = 'Allow admin authentication'
    ) THEN
        CREATE POLICY "Allow admin authentication" ON public.admin_users
            FOR SELECT USING (true);
    END IF;
END $$;

-- Only authenticated admins can manage admin users (INSERT/UPDATE/DELETE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy pol
        JOIN pg_class pc ON pc.oid = pol.polrelid
        WHERE pc.relname = 'admin_users' AND pol.polname = 'Admins can manage admin users'
    ) THEN
        CREATE POLICY "Admins can manage admin users" ON public.admin_users
            FOR ALL USING (current_setting('app.is_admin', true)::boolean = true)
            WITH CHECK (current_setting('app.is_admin', true)::boolean = true);
    END IF;
END $$;

-- Create RLS policies for admin_logs table
-- Only admins can access the admin_logs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy pol
        JOIN pg_class pc ON pc.oid = pol.polrelid
        WHERE pc.relname = 'admin_logs' AND pol.polname = 'Admins can manage admin logs'
    ) THEN
        CREATE POLICY "Admins can manage admin logs" ON public.admin_logs
            FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT USAGE ON SEQUENCE public.admin_users_admin_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.admin_logs_log_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.admin_users IS 'Table for managing admin panel users';
COMMENT ON COLUMN public.admin_users.admin_id IS 'Unique identifier for admin user';
COMMENT ON COLUMN public.admin_users.username IS 'Admin username for login';
COMMENT ON COLUMN public.admin_users.password IS 'Hashed password for admin login';
COMMENT ON COLUMN public.admin_users.full_name IS 'Full name of the admin user';
COMMENT ON COLUMN public.admin_users.is_active IS 'Whether the admin account is active';
COMMENT ON COLUMN public.admin_users.created_at IS 'Timestamp when admin account was created';

COMMENT ON TABLE public.admin_logs IS 'Table for logging admin actions';
COMMENT ON COLUMN public.admin_logs.log_id IS 'Unique identifier for log entry';
COMMENT ON COLUMN public.admin_logs.admin_username IS 'Username of admin who performed the action';
COMMENT ON COLUMN public.admin_logs.action IS 'Description of the action performed';
COMMENT ON COLUMN public.admin_logs.ip_address IS 'IP address of the admin user';
COMMENT ON COLUMN public.admin_logs.created_at IS 'Timestamp when the action was performed';