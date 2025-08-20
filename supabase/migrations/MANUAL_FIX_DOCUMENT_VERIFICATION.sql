-- MANUAL FIX FOR DOCUMENT VERIFICATION
-- Run this SQL directly in your Supabase SQL Editor or database client

-- Step 1: Create the missing update_document_status RPC function
CREATE OR REPLACE FUNCTION public.update_document_status(
    document_id INTEGER,
    new_status VARCHAR(50),
    admin_national_number VARCHAR(50),
    reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_count INTEGER;
    updated_doc RECORD;
BEGIN
    -- Update the document status
    UPDATE public.uploaded_documents 
    SET 
        upload_status = new_status,
        verified_at = NOW(),
        verified_by = admin_national_number,
        rejection_reason = CASE 
            WHEN new_status = 'rejected' THEN reason 
            ELSE NULL 
        END
    WHERE upload_id = document_id;
    
    -- Get the count of affected rows
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    -- Get the updated document for return
    SELECT * INTO updated_doc 
    FROM public.uploaded_documents 
    WHERE upload_id = document_id;
    
    -- Return success response with updated document data
    RETURN json_build_object(
        'success', true,
        'updated_rows', result_count,
        'document', row_to_json(updated_doc),
        'message', CASE 
            WHEN result_count > 0 THEN 'Document status updated successfully'
            ELSE 'No document found with the specified ID'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'updated_rows', 0,
            'message', 'Failed to update document status: ' || SQLERRM
        );
END;
$$;

-- Step 2: Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.update_document_status TO authenticated;

-- Step 3: Ensure the uploaded_documents table has all required columns
-- (Run these only if the columns don't exist)
ALTER TABLE public.uploaded_documents 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 4: Ensure proper permissions on the table
GRANT SELECT, UPDATE ON public.uploaded_documents TO authenticated;

-- Step 5: Create RLS policy for document updates (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'uploaded_documents' 
        AND policyname = 'Allow document status updates'
    ) THEN
        CREATE POLICY "Allow document status updates" ON public.uploaded_documents
            FOR UPDATE USING (true);
    END IF;
END $$;

-- Verification queries (optional - run these to check if everything is working)
-- SELECT * FROM information_schema.routines WHERE routine_name = 'update_document_status';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploaded_documents';
-- SELECT * FROM pg_policies WHERE tablename = 'uploaded_documents';