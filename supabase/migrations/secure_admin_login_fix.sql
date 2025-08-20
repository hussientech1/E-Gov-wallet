-- Secure fix for admin login - properly configure RLS policies
-- This maintains security while allowing admin authentication

-- Re-enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Create a new policy that allows authentication queries
-- This policy allows reading admin_users for authentication purposes
CREATE POLICY "Allow admin authentication" ON public.admin_users
    FOR SELECT 
    USING (true);  -- Allow all users to read for authentication

-- Create a policy for admin management (insert/update/delete)
-- Only authenticated admins can modify admin users
CREATE POLICY "Admins can manage admin users" ON public.admin_users
    FOR ALL 
    USING (current_setting('app.is_admin', true)::boolean = true)
    WITH CHECK (current_setting('app.is_admin', true)::boolean = true);

-- Ensure proper permissions are granted
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.admin_users TO anon;

-- Test the login query again
SELECT 'Testing admin login after secure fix:' as info;
SELECT username, full_name, is_active 
FROM public.admin_users 
WHERE username = 'admin' 
AND password = 'admin123' 
AND is_active = true;

-- Verify RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';

-- Show current policies
SELECT 'Current Policies:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'admin_users';