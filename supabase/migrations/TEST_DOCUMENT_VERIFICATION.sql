-- TEST DOCUMENT VERIFICATION FUNCTIONALITY
-- Run these queries in your Supabase SQL Editor to test the function directly

-- Step 1: Check if the function exists
SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'update_document_status';

-- Step 2: Check current documents and their status
SELECT 
    upload_id,
    application_id,
    document_type,
    upload_status,
    verified_at,
    verified_by,
    rejection_reason
FROM uploaded_documents 
ORDER BY upload_id;

-- Step 3: Test the function directly (replace 1 with an actual upload_id from step 2)
-- SELECT public.update_document_status(1, 'verified', 'admin123', null);

-- Step 4: Check if the document was updated
-- SELECT 
--     upload_id,
--     upload_status,
--     verified_at,
--     verified_by
-- FROM uploaded_documents 
-- WHERE upload_id = 1;

-- Step 5: Check table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'uploaded_documents';

-- Step 6: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'uploaded_documents';