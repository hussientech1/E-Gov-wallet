-- Database Setup Script for MoI Platform
-- Run this in your Supabase SQL Editor to fix service application issues

-- 1. Insert sample services if they don't exist
INSERT INTO public.services (service_id, service_name, description, fee, processing_time, is_active, eligibility_type, required_documents) 
VALUES 
  (1, 'Passport Service', 'Apply for a new passport or renew existing one', 50.00, '7-10 business days', true, 'both', ARRAY['National ID', 'Birth Certificate', 'Photo']),
  (2, 'National ID Service', 'Apply for a new national ID or replace lost/damaged one', 25.00, '3-5 business days', true, 'national_only', ARRAY['Birth Certificate', 'Photo']),
  (3, 'Birth Certificate Service', 'Apply for a birth certificate', 15.00, '5-7 business days', true, 'both', ARRAY['Hospital Records', 'Parent ID']),
  (4, 'Driver License Service', 'Apply for a driver license', 75.00, '10-14 business days', true, 'both', ARRAY['National ID', 'Medical Certificate', 'Photo'])
ON CONFLICT (service_id) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  description = EXCLUDED.description,
  fee = EXCLUDED.fee,
  processing_time = EXCLUDED.processing_time,
  is_active = EXCLUDED.is_active,
  eligibility_type = EXCLUDED.eligibility_type,
  required_documents = EXCLUDED.required_documents;

-- 2. Fix RLS policies for services table (allow public read access)
DROP POLICY IF EXISTS "Allow public read access to services" ON public.services;
CREATE POLICY "Allow public read access to services" ON public.services
    FOR SELECT USING (true);

-- 3. Fix RLS policies for users table (users can read their own data)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

-- 4. Fix RLS policies for service_applications table
DROP POLICY IF EXISTS "Users can view their own applications" ON public.service_applications;
CREATE POLICY "Users can view their own applications" ON public.service_applications
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.service_applications;
CREATE POLICY "Users can insert their own applications" ON public.service_applications
    FOR INSERT WITH CHECK (national_number = current_setting('app.current_user_id', true));

-- 5. Fix RLS policies for user_documents table
DROP POLICY IF EXISTS "Users can view their own documents" ON public.user_documents;
CREATE POLICY "Users can view their own documents" ON public.user_documents
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

-- 6. Grant necessary permissions
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_applications TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_documents TO authenticated;
GRANT SELECT, INSERT ON public.uploaded_documents TO authenticated;
GRANT SELECT, UPDATE ON public.driving_exams TO authenticated;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE public.service_applications_application_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.uploaded_documents_upload_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.driving_exams_exam_id_seq TO authenticated;

-- 7. Create a more permissive policy for testing (remove in production)
DROP POLICY IF EXISTS "Temporary permissive policy for service_applications" ON public.service_applications;
CREATE POLICY "Temporary permissive policy for service_applications" ON public.service_applications
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Temporary permissive policy for users" ON public.users;
CREATE POLICY "Temporary permissive policy for users" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Temporary permissive policy for user_documents" ON public.user_documents;
CREATE POLICY "Temporary permissive policy for user_documents" ON public.user_documents
    FOR SELECT USING (true);

-- 8. Verify the setup
SELECT 'Services count:' as info, count(*) as value FROM public.services
UNION ALL
SELECT 'RLS enabled on services:' as info, CASE WHEN rowsecurity THEN 1 ELSE 0 END as value FROM pg_tables WHERE tablename = 'services' AND schemaname = 'public'
UNION ALL
SELECT 'RLS enabled on service_applications:' as info, CASE WHEN rowsecurity THEN 1 ELSE 0 END as value FROM pg_tables WHERE tablename = 'service_applications' AND schemaname = 'public';