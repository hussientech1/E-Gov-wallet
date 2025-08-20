-- Migration: Add user enhancements for family details and user type
-- Date: 2025-01-11
-- Description: Add fields for birth certificate family details and user type classification

-- Add user type and family details to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'national' CHECK (user_type IN ('national', 'resident')),
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS father_national_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS mother_national_number VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN public.users.user_type IS 'Type of user: national (Sudanese citizen) or resident (Iqama holder)';
COMMENT ON COLUMN public.users.father_name IS 'Full name of father for birth certificate generation';
COMMENT ON COLUMN public.users.mother_name IS 'Full name of mother for birth certificate generation';
COMMENT ON COLUMN public.users.father_national_number IS 'National number of father';
COMMENT ON COLUMN public.users.mother_national_number IS 'National number of mother';

-- Create index for user_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);