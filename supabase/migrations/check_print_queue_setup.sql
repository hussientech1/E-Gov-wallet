-- Check if print_queue table exists and troubleshoot issues
-- Run this in Supabase SQL Editor

-- 1. Check if print_queue table exists
SELECT 'Checking if print_queue table exists:' as step;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'print_queue';

-- 2. If table exists, check its structure
SELECT 'Print queue table structure:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'print_queue' 
ORDER BY ordinal_position;

-- 3. Check RLS policies on print_queue
SELECT 'RLS policies on print_queue:' as step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'print_queue';

-- 4. Check if RLS is enabled
SELECT 'RLS status on print_queue:' as step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'print_queue';

-- 5. Check permissions
SELECT 'Permissions on print_queue:' as step;
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'print_queue';

-- 6. Try to create the table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'print_queue') THEN
        -- Create print_queue table
        CREATE TABLE public.print_queue (
            queue_id SERIAL PRIMARY KEY,
            application_id INTEGER NOT NULL,
            national_number VARCHAR(20) NOT NULL,
            user_full_name VARCHAR(255) NOT NULL,
            service_type VARCHAR(100) NOT NULL,
            service_id INTEGER NOT NULL,
            approval_date TIMESTAMP WITH TIME ZONE,
            print_status VARCHAR(20) DEFAULT 'pending_print',
            printed_at TIMESTAMP WITH TIME ZONE,
            printed_by VARCHAR(50),
            office_location VARCHAR(255) NOT NULL,
            document_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add foreign key constraints
        ALTER TABLE public.print_queue
        ADD CONSTRAINT print_queue_application_id_fkey 
        FOREIGN KEY (application_id) REFERENCES service_applications(application_id);

        ALTER TABLE public.print_queue
        ADD CONSTRAINT print_queue_national_number_fkey 
        FOREIGN KEY (national_number) REFERENCES users(national_number);

        ALTER TABLE public.print_queue
        ADD CONSTRAINT print_queue_service_id_fkey 
        FOREIGN KEY (service_id) REFERENCES services(service_id);

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(print_status);
        CREATE INDEX IF NOT EXISTS idx_print_queue_approval_date ON public.print_queue(approval_date);
        CREATE INDEX IF NOT EXISTS idx_print_queue_national_number ON public.print_queue(national_number);

        -- Disable RLS temporarily for testing
        ALTER TABLE public.print_queue DISABLE ROW LEVEL SECURITY;

        -- Grant permissions
        GRANT ALL ON public.print_queue TO authenticated;
        GRANT ALL ON public.print_queue TO anon;
        GRANT USAGE ON SEQUENCE public.print_queue_queue_id_seq TO authenticated;
        GRANT USAGE ON SEQUENCE public.print_queue_queue_id_seq TO anon;

        RAISE NOTICE 'Print queue table created successfully';
    ELSE
        RAISE NOTICE 'Print queue table already exists';
    END IF;
END $$;

-- 7. Test basic query
SELECT 'Testing basic query:' as step;
SELECT COUNT(*) as total_items FROM public.print_queue;

-- 8. Insert test data if table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM public.print_queue) = 0 THEN
        -- Insert test data only if we have related data
        IF EXISTS (SELECT 1 FROM service_applications LIMIT 1) AND 
           EXISTS (SELECT 1 FROM users LIMIT 1) AND 
           EXISTS (SELECT 1 FROM services LIMIT 1) THEN
            
            INSERT INTO public.print_queue (
                application_id, 
                national_number, 
                user_full_name, 
                service_type, 
                service_id, 
                approval_date, 
                office_location
            )
            SELECT 
                sa.application_id,
                sa.national_number,
                u.full_name,
                s.service_name,
                sa.service_id,
                NOW() - INTERVAL '2 hours',
                sa.office_location
            FROM service_applications sa
            JOIN users u ON sa.national_number = u.national_number
            JOIN services s ON sa.service_id = s.service_id
            WHERE sa.application_status = 'approved'
            LIMIT 3;
            
            RAISE NOTICE 'Test data inserted into print_queue';
        ELSE
            RAISE NOTICE 'No related data found to create test print queue items';
        END IF;
    END IF;
END $$;

-- 9. Final check
SELECT 'Final verification:' as step;
SELECT 
    queue_id,
    application_id,
    user_full_name,
    service_type,
    print_status,
    approval_date,
    office_location
FROM public.print_queue 
ORDER BY created_at DESC 
LIMIT 5;