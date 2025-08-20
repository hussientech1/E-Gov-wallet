-- Fix Service Application Issues
-- This script addresses common problems preventing service applications

-- 1. Ensure services table has data
INSERT INTO public.services (service_name, description, fee, processing_time, is_active, eligibility_type, required_documents) 
VALUES 
  ('Passport Service', 'Apply for a new passport or renew existing one', 50.00, '7-10 business days', true, 'both', ARRAY['National ID', 'Birth Certificate', 'Photo']),
  ('National ID Service', 'Apply for a new national ID or replace lost/damaged one', 25.00, '3-5 business days', true, 'national_only', ARRAY['Birth Certificate', 'Photo']),
  ('Birth Certificate Service', 'Apply for a birth certificate', 15.00, '5-7 business days', true, 'both', ARRAY['Hospital Records', 'Parent ID']),
  ('Driver License Service', 'Apply for a driver license', 75.00, '10-14 business days', true, 'both', ARRAY['National ID', 'Medical Certificate', 'Photo'])
ON CONFLICT (service_id) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  description = EXCLUDED.description,
  fee = EXCLUDED.fee,
  processing_time = EXCLUDED.processing_time,
  is_active = EXCLUDED.is_active,
  eligibility_type = EXCLUDED.eligibility_type,
  required_documents = EXCLUDED.required_documents;

-- 2. Create a test user if none exists (replace with actual user data)
-- Note: This should be done through the application's registration process
-- INSERT INTO public.users (national_number, full_name, phone_number, password_hash, user_type)
-- VALUES ('1234567890', 'Test User', '+1234567890', 'hashed_password', 'national')
-- ON CONFLICT (national_number) DO NOTHING;

-- 3. Verify RLS policies are correctly set up
-- Check if RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'services', 'service_applications', 'user_documents', 'uploaded_documents', 'driving_exams');

-- 4. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'services', 'service_applications', 'user_documents', 'uploaded_documents', 'driving_exams');

-- 5. Ensure proper permissions are granted
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_applications TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_documents TO authenticated;
GRANT SELECT, INSERT ON public.uploaded_documents TO authenticated;
GRANT SELECT, UPDATE ON public.driving_exams TO authenticated;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE public.service_applications_application_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.uploaded_documents_upload_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.driving_exams_exam_id_seq TO authenticated;

-- 6. Check if the custom functions exist and work
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('custom_login', 'register_user', 'submit_service_application', 'get_services');