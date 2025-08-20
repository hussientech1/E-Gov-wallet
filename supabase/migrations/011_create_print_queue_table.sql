-- Migration: Create print queue table for managing approved document printing
-- Date: 2025-01-12
-- Description: Create print_queue table to track approved service applications ready for printing

-- Create print_queue table
CREATE TABLE IF NOT EXISTS public.print_queue (
    queue_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES public.service_applications(application_id) ON DELETE CASCADE,
    national_number VARCHAR(20) NOT NULL REFERENCES public.users(national_number) ON DELETE CASCADE,
    user_full_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_id INTEGER NOT NULL REFERENCES public.services(service_id) ON DELETE CASCADE,
    approval_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    print_status VARCHAR(20) DEFAULT 'pending_print' CHECK (print_status IN ('pending_print', 'printed')),
    printed_at TIMESTAMP WITH TIME ZONE NULL,
    printed_by VARCHAR(50) NULL REFERENCES public.admin_users(username) ON DELETE SET NULL,
    office_location VARCHAR(100) NOT NULL,
    document_id INTEGER NULL REFERENCES public.user_documents(doc_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(print_status);
CREATE INDEX IF NOT EXISTS idx_print_queue_approval_date ON public.print_queue(approval_date DESC);
CREATE INDEX IF NOT EXISTS idx_print_queue_service_type ON public.print_queue(service_type);
CREATE INDEX IF NOT EXISTS idx_print_queue_office ON public.print_queue(office_location);
CREATE INDEX IF NOT EXISTS idx_print_queue_national_number ON public.print_queue(national_number);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_print_queue_unique_application 
ON public.print_queue(application_id);

-- Enable Row Level Security
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for print_queue table
-- Only admins can access the print queue
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy pol
        JOIN pg_class pc ON pc.oid = pol.polrelid
        WHERE pc.relname = 'print_queue' AND pol.polname = 'Admins can manage print queue'
    ) THEN
        CREATE POLICY "Admins can manage print queue" ON public.print_queue
            FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_print_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_print_queue_updated_at
    BEFORE UPDATE ON public.print_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_print_queue_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.print_queue TO authenticated;
GRANT USAGE ON SEQUENCE public.print_queue_queue_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.print_queue IS 'Queue for approved service applications ready for document printing';
COMMENT ON COLUMN public.print_queue.queue_id IS 'Unique identifier for print queue entry';
COMMENT ON COLUMN public.print_queue.application_id IS 'Reference to the approved service application';
COMMENT ON COLUMN public.print_queue.national_number IS 'User national number for the document';
COMMENT ON COLUMN public.print_queue.user_full_name IS 'Full name of the user (cached for performance)';
COMMENT ON COLUMN public.print_queue.service_type IS 'Type of service/document (cached for performance)';
COMMENT ON COLUMN public.print_queue.print_status IS 'Current print status: pending_print or printed';
COMMENT ON COLUMN public.print_queue.printed_at IS 'Timestamp when document was printed';
COMMENT ON COLUMN public.print_queue.printed_by IS 'Admin username who printed the document';
COMMENT ON COLUMN public.print_queue.office_location IS 'Office where document should be collected';
COMMENT ON COLUMN public.print_queue.document_id IS 'Reference to the created user document';