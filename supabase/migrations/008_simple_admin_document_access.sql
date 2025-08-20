-- Simple fix for admin document access
-- This temporarily disables RLS on uploaded_documents to allow admin access
-- This is a quick fix - for production you'd want more granular RLS policies

-- Disable RLS on uploaded_documents table to allow admin access
ALTER TABLE public.uploaded_documents DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users (including admins)
GRANT SELECT, INSERT, UPDATE ON public.uploaded_documents TO authenticated;
GRANT USAGE ON SEQUENCE public.uploaded_documents_upload_id_seq TO authenticated;

-- Add comment explaining this is a temporary fix
COMMENT ON TABLE public.uploaded_documents IS 'RLS disabled temporarily to allow admin access - should be re-enabled with proper policies in production';