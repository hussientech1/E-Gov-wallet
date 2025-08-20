-- Test the update_document_status function directly
-- This will test if the function can update document ID 1

-- Test the function with document ID 1
SELECT public.update_document_status(1, 'verified', 'admin123', null);

-- Check if the document was updated
SELECT 
    upload_id,
    upload_status,
    verified_at,
    verified_by
FROM uploaded_documents 
WHERE upload_id = 1;