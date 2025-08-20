-- Migration: Add service eligibility and document tracking enhancements
-- Date: 2025-01-11
-- Description: Add service eligibility classification and document upload tracking

-- Add eligibility type to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS eligibility_type VARCHAR(20) DEFAULT 'both' CHECK (eligibility_type IN ('national_only', 'resident_only', 'both'));

-- Add document tracking to service_applications table
ALTER TABLE public.service_applications 
ADD COLUMN IF NOT EXISTS documents_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.services.eligibility_type IS 'Service eligibility: national_only, resident_only, or both';
COMMENT ON COLUMN public.service_applications.documents_uploaded IS 'Whether all required documents have been uploaded';
COMMENT ON COLUMN public.service_applications.documents_verified IS 'Whether uploaded documents have been verified by admin';
COMMENT ON COLUMN public.service_applications.admin_notes IS 'Internal notes from admin review';

-- Create index for eligibility_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_services_eligibility_type ON public.services(eligibility_type);

-- Update existing services with eligibility classification
-- Passport and ID Card: National Only
-- Birth Certificate: National Only  
-- Driver License: Both
UPDATE public.services 
SET eligibility_type = 'national_only' 
WHERE service_name IN ('Passport', 'ID Card', 'Birth Certificate');

UPDATE public.services 
SET eligibility_type = 'both' 
WHERE service_name = 'Driver License';