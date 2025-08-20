-- Migration: Update Supabase types and RLS policies
-- Date: 2025-01-11
-- Description: Add RLS policies for new tables and update existing policies

-- Enable RLS on new tables
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_documents table
-- Users can only see their own uploaded documents
CREATE POLICY "Users can view their own uploaded documents" ON public.uploaded_documents
    FOR SELECT USING (
        application_id IN (
            SELECT application_id FROM public.service_applications 
            WHERE national_number = current_setting('app.current_user_id', true)
        )
    );

-- Users can insert documents for their own applications
CREATE POLICY "Users can upload documents for their applications" ON public.uploaded_documents
    FOR INSERT WITH CHECK (
        application_id IN (
            SELECT application_id FROM public.service_applications 
            WHERE national_number = current_setting('app.current_user_id', true)
        )
    );

-- Admins can view all uploaded documents
CREATE POLICY "Admins can view all uploaded documents" ON public.uploaded_documents
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- RLS Policies for driving_exams table
-- Users can view their own driving exams
CREATE POLICY "Users can view their own driving exams" ON public.driving_exams
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

-- Users can update their own exam results
CREATE POLICY "Users can update their exam results" ON public.driving_exams
    FOR UPDATE USING (national_number = current_setting('app.current_user_id', true))
    WITH CHECK (national_number = current_setting('app.current_user_id', true));

-- Admins can manage all driving exams
CREATE POLICY "Admins can manage all driving exams" ON public.driving_exams
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Update existing service_applications policies to include new fields
DROP POLICY IF EXISTS "Users can view their own applications" ON public.service_applications;
CREATE POLICY "Users can view their own applications" ON public.service_applications
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.uploaded_documents TO authenticated;
GRANT SELECT, UPDATE ON public.driving_exams TO authenticated;
GRANT USAGE ON SEQUENCE public.uploaded_documents_upload_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.driving_exams_exam_id_seq TO authenticated;