-- COMPREHENSIVE DIAGNOSTIC FOR DOCUMENT VERIFICATION ISSUE

-- Step 1: Check if the function exists
SELECT 
    routine_name, 
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_document_status';

-- Step 2: Try to call the function and see what happens
-- (This should show us the exact error if there is one)
DO $$
BEGIN
    RAISE NOTICE 'Testing function call...';
    PERFORM public.update_document_status(1, 'verified', 'admin123', null);
    RAISE NOTICE 'Function call succeeded';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function call failed: %', SQLERRM;
END $$;

-- Step 3: Check current user and role
SELECT current_user, current_role;

-- Step 4: Check if we can update the table directly
UPDATE uploaded_documents 
SET upload_status = 'verified', 
    verified_at = NOW(), 
    verified_by = 'direct_test'
WHERE upload_id = 1;

-- Step 5: Check if the direct update worked
SELECT upload_id, upload_status, verified_at, verified_by 
FROM uploaded_documents 
WHERE upload_id = 1;

-- Step 6: Reset the document back to pending for further testing
UPDATE uploaded_documents 
SET upload_status = 'pending', 
    verified_at = NULL, 
    verified_by = NULL
WHERE upload_id = 1;