-- Migration: Update services with proper eligibility types
-- Date: 2025-01-11
-- Description: Add eligibility types to services and populate with appropriate values

-- Add eligibility_type column if it doesn't exist
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS eligibility_type VARCHAR(20) DEFAULT 'both' 
CHECK (eligibility_type IN ('national_only', 'resident_only', 'both'));

-- Update existing services with appropriate eligibility types
-- These are example services - adjust based on actual requirements

-- National ID services (nationals only)
UPDATE services 
SET eligibility_type = 'national_only' 
WHERE service_name ILIKE '%national id%' 
   OR service_name ILIKE '%passport%'
   OR service_name ILIKE '%birth certificate%'
   OR service_name ILIKE '%citizenship%';

-- Iqama/Residence services (residents only)
UPDATE services 
SET eligibility_type = 'resident_only' 
WHERE service_name ILIKE '%iqama%' 
   OR service_name ILIKE '%residence%'
   OR service_name ILIKE '%work permit%'
   OR service_name ILIKE '%resident%';

-- Driver's license and other universal services (both)
UPDATE services 
SET eligibility_type = 'both' 
WHERE service_name ILIKE '%driver%'
   OR service_name ILIKE '%license%'
   OR service_name ILIKE '%vehicle%'
   OR service_name ILIKE '%traffic%'
   OR eligibility_type IS NULL;

-- Insert sample services if none exist
INSERT INTO services (service_name, description, fee, processing_time, eligibility_type, is_active, required_documents)
SELECT * FROM (VALUES
  ('National ID Issuance', 'Issue new national identity card for Sudanese citizens', 50.00, '7-10 business days', 'national_only', true, ARRAY['Birth Certificate', 'Photo', 'Proof of Address']),
  ('National ID Renewal', 'Renew existing national identity card', 30.00, '5-7 business days', 'national_only', true, ARRAY['Current National ID', 'Photo']),
  ('Passport Issuance', 'Issue new Sudanese passport', 150.00, '14-21 business days', 'national_only', true, ARRAY['National ID', 'Birth Certificate', 'Photo', 'Application Form']),
  ('Passport Renewal', 'Renew existing Sudanese passport', 100.00, '10-14 business days', 'national_only', true, ARRAY['Current Passport', 'National ID', 'Photo']),
  ('Iqama Issuance', 'Issue new residence permit (Iqama)', 200.00, '14-21 business days', 'resident_only', true, ARRAY['Passport', 'Visa', 'Sponsor Letter', 'Medical Certificate', 'Photo']),
  ('Iqama Renewal', 'Renew existing residence permit', 150.00, '10-14 business days', 'resident_only', true, ARRAY['Current Iqama', 'Passport', 'Sponsor Letter']),
  ('Driver License Issuance', 'Issue new driver license', 75.00, '7-10 business days', 'both', true, ARRAY['ID Document', 'Medical Certificate', 'Driving Test Certificate', 'Photo']),
  ('Driver License Renewal', 'Renew existing driver license', 50.00, '3-5 business days', 'both', true, ARRAY['Current License', 'ID Document', 'Medical Certificate']),
  ('Birth Certificate', 'Issue birth certificate', 25.00, '5-7 business days', 'national_only', true, ARRAY['Hospital Birth Record', 'Parents ID', 'Marriage Certificate']),
  ('Marriage Certificate', 'Issue marriage certificate', 40.00, '7-10 business days', 'both', true, ARRAY['Marriage Contract', 'Witnesses ID', 'Couples ID'])
) AS new_services(service_name, description, fee, processing_time, eligibility_type, is_active, required_documents)
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = new_services.service_name);

-- Add index for eligibility_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_services_eligibility_type ON services(eligibility_type);

-- Add comments for documentation
COMMENT ON COLUMN services.eligibility_type IS 'Service eligibility: national_only (Sudanese citizens), resident_only (Iqama holders), both (all users)';