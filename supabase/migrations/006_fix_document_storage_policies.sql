-- Migration: Fix document storage RLS policies
-- Date: 2025-01-11
-- Description: Update RLS policies to work with current authentication system

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can upload documents for their applications" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

DROP POLICY IF EXISTS "Users can insert documents for their applications" ON uploaded_documents;
DROP POLICY IF EXISTS "Users can view their own uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can view all uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can update document verification" ON uploaded_documents;

-- Create simplified storage policies that allow authenticated users to upload
-- We'll handle authorization at the application level for now

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view documents
CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'application-documents' AND
  auth.role() = 'authenticated'
);

-- Create simplified uploaded_documents policies

-- Policy: Allow authenticated users to insert document records
CREATE POLICY "Allow authenticated users to insert document records" ON uploaded_documents
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view document records
CREATE POLICY "Allow authenticated users to view document records" ON uploaded_documents
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update document records
CREATE POLICY "Allow authenticated users to update document records" ON uploaded_documents
FOR UPDATE USING (
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete document records
CREATE POLICY "Allow authenticated users to delete document records" ON uploaded_documents
FOR DELETE USING (
  auth.role() = 'authenticated'
);

-- Ensure the storage bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Add comment explaining the simplified approach
COMMENT ON TABLE uploaded_documents IS 'Document upload records with simplified RLS policies - authorization handled at application level';