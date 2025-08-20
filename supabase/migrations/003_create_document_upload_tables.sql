-- Migration: Create document upload and driving exam tables
-- Date: 2025-01-11
-- Description: Create tables for document uploads and driving license exam management

-- Create uploaded_documents table for storing user-uploaded documents
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    upload_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES public.service_applications(application_id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(50) REFERENCES public.admin_users(username)
);

-- Create driving_exams table for managing driving license exams
CREATE TABLE IF NOT EXISTS public.driving_exams (
    exam_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES public.service_applications(application_id) ON DELETE CASCADE,
    national_number VARCHAR(50) NOT NULL REFERENCES public.users(national_number),
    exam_date DATE,
    exam_time TIME,
    office_location VARCHAR(255) NOT NULL,
    exam_status VARCHAR(20) DEFAULT 'scheduled' CHECK (exam_status IN ('scheduled', 'completed', 'failed', 'cancelled')),
    result_uploaded BOOLEAN DEFAULT FALSE,
    result_file_path TEXT,
    result_verified BOOLEAN DEFAULT FALSE,
    exam_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE public.uploaded_documents IS 'Stores documents uploaded by users for service applications';
COMMENT ON TABLE public.driving_exams IS 'Manages driving license exam schedules and results';

COMMENT ON COLUMN public.uploaded_documents.document_type IS 'Type of document (e.g., passport_photo, id_copy, proof_of_payment)';
COMMENT ON COLUMN public.uploaded_documents.upload_status IS 'Status of document verification by admin';
COMMENT ON COLUMN public.driving_exams.exam_status IS 'Current status of the driving exam';
COMMENT ON COLUMN public.driving_exams.result_uploaded IS 'Whether exam result document has been uploaded';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_application_id ON public.uploaded_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status ON public.uploaded_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_driving_exams_application_id ON public.driving_exams(application_id);
CREATE INDEX IF NOT EXISTS idx_driving_exams_national_number ON public.driving_exams(national_number);
CREATE INDEX IF NOT EXISTS idx_driving_exams_status ON public.driving_exams(exam_status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_driving_exams_updated_at 
    BEFORE UPDATE ON public.driving_exams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();