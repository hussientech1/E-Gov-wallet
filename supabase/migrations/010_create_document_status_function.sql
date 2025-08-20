-- Create the missing update_document_status RPC function
-- This function allows admins to update document verification status

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

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.update_document_status TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_document_status IS 'Updates document verification status with admin information and optional rejection reason';