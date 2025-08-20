-- Simple test to verify print_queue table is working
-- Run this to confirm the setup is correct

-- Test basic query
SELECT 'Testing print_queue table access:' as test;
SELECT COUNT(*) as total_items FROM public.print_queue;

-- Show sample data
SELECT 'Sample print queue data:' as test;
SELECT 
    queue_id,
    application_id,
    user_full_name,
    service_type,
    print_status,
    approval_date,
    office_location
FROM public.print_queue 
ORDER BY created_at DESC 
LIMIT 5;

-- Test the exact query used by the app
SELECT 'Testing app query:' as test;
SELECT *
FROM print_queue
ORDER BY approval_date DESC;