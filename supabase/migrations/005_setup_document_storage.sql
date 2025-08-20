-- Migration: Setup document storage bucket and policies
-- Date: 2025-01-11
-- Description: Create storage bucket for application documents and set up RLS policies

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload documents for their own applications
CREATE POLICY "Users can upload documents for their applications" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'application-documents' AND
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT application_id::text 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Policy: Users can view documents for their own applications
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'application-documents' AND
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT application_id::text 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'application-documents' AND
  auth.jwt() ->> 'app.is_admin' = 'true'
);

-- Policy: Users can update their own documents (for re-uploads)
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'application-documents' AND
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT application_id::text 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Policy: Users can delete their own documents (for re-uploads)
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'application-documents' AND
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  (storage.foldername(name))[1] IN (
    SELECT application_id::text 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Add RLS policies for uploaded_documents table
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert documents for their own applications
CREATE POLICY "Users can insert documents for their applications" ON uploaded_documents
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  application_id IN (
    SELECT application_id 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Policy: Users can view their own uploaded documents
CREATE POLICY "Users can view their own uploaded documents" ON uploaded_documents
FOR SELECT USING (
  auth.jwt() ->> 'app.current_user_id' IS NOT NULL AND
  application_id IN (
    SELECT application_id 
    FROM service_applications 
    WHERE national_number = auth.jwt() ->> 'app.current_user_id'
  )
);

-- Policy: Admins can view all uploaded documents
CREATE POLICY "Admins can view all uploaded documents" ON uploaded_documents
FOR SELECT USING (
  auth.jwt() ->> 'app.is_admin' = 'true'
);

-- Policy: Admins can update document verification status
CREATE POLICY "Admins can update document verification" ON uploaded_documents
FOR UPDATE USING (
  auth.jwt() ->> 'app.is_admin' = 'true'
);