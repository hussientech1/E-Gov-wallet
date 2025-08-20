# MoI Platform - Database Disaster Recovery (DBDR)

## Overview
This document contains comprehensive database disaster recovery procedures, backup strategies, and restoration queries for the Ministry of Interior Platform database system.

## Table of Contents
1. [Complete Database Schema Creation](#complete-database-schema-creation)
2. [Database Functions](#database-functions)
3. [Row Level Security Setup](#row-level-security-setup)
4. [Backup Procedures](#backup-procedures)
5. [Restoration Procedures](#restoration-procedures)
6. [Data Migration Scripts](#data-migration-scripts)
7. [Maintenance and Optimization](#maintenance-and-optimization)
8. [Emergency Recovery Procedures](#emergency-recovery-procedures)
9. [Automated Backup Scripts](#automated-backup-scripts)

---

## Complete Database Schema Creation

### 1. Drop Existing Schema (Use with Caution)

```sql
-- =====================================================
-- COMPLETE DATABASE RESET - USE WITH EXTREME CAUTION
-- =====================================================

-- Drop all functions first
DROP FUNCTION IF EXISTS public.register_user(character varying, character varying, character varying, text);
DROP FUNCTION IF EXISTS public.register_user(character varying, character varying, character varying, text, character varying, character varying, character varying, character varying);
DROP FUNCTION IF EXISTS public.get_user_notifications;
DROP FUNCTION IF EXISTS public.get_user_documents;
DROP FUNCTION IF EXISTS public.admin_review_application;
DROP FUNCTION IF EXISTS public.get_admin_applications;
DROP FUNCTION IF EXISTS public.submit_service_application;
DROP FUNCTION IF EXISTS public.mark_notification_read;
DROP FUNCTION IF EXISTS public.handle_auth_login;
DROP FUNCTION IF EXISTS public.custom_login;
DROP FUNCTION IF EXISTS public.admin_login;
DROP FUNCTION IF EXISTS public.get_services;
DROP FUNCTION IF EXISTS public.update_updated_at_column;
DROP FUNCTION IF EXISTS public.update_print_queue_updated_at;

-- Drop all tables with CASCADE
DROP TABLE IF EXISTS public.support_requests CASCADE;
DROP TABLE IF EXISTS public.driving_exams CASCADE;
DROP TABLE IF EXISTS public.uploaded_documents CASCADE;
DROP TABLE IF EXISTS public.print_queue CASCADE;
DROP TABLE IF EXISTS public.service_applications CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_documents CASCADE;
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;
DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS public.document_status CASCADE;
DROP TYPE IF EXISTS public.document_type CASCADE;
DROP TYPE IF EXISTS public.doc_type CASCADE;
```

### 2. Create Enum Types

```sql
-- =====================================================
-- CREATE ENUM TYPES
-- =====================================================

CREATE TYPE public.document_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('passport', 'national_id', 'birth_certificate', 'driver_license');
CREATE TYPE public.doc_type AS ENUM ('passport', 'id_card', 'birth_certificate', 'marriage_certificate');
```

### 3. Create Core Tables

```sql
-- =====================================================
-- CREATE CORE TABLES
-- =====================================================

-- Users table (Core user accounts)
CREATE TABLE public.users (
    national_number VARCHAR PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    password_hash TEXT NOT NULL,
    phone_number VARCHAR NOT NULL,
    email VARCHAR,
    gender VARCHAR,
    address TEXT,
    state VARCHAR,
    birth_date DATE,
    profile_completed BOOLEAN DEFAULT FALSE,
    dark_mode_enabled BOOLEAN DEFAULT FALSE,
    language_preference VARCHAR DEFAULT 'en',
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Enhanced fields from migrations
    user_type VARCHAR(20) DEFAULT 'national' CHECK (user_type IN ('national', 'resident')),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    father_national_number VARCHAR(50),
    mother_national_number VARCHAR(50)
);

-- Services table (Available government services)
CREATE TABLE public.services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR NOT NULL,
    description TEXT,
    fee NUMERIC,
    required_documents TEXT[],
    processing_time VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    -- Enhanced field from migrations
    eligibility_type VARCHAR(20) DEFAULT 'both' CHECK (eligibility_type IN ('national_only', 'resident_only', 'both'))
);

-- Admin users table
CREATE TABLE public.admin_users (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin logs table
CREATE TABLE public.admin_logs (
    log_id SERIAL PRIMARY KEY,
    admin_username VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE public.password_reset_tokens (
    token_id SERIAL PRIMARY KEY,
    national_number VARCHAR REFERENCES public.users(national_number) ON DELETE CASCADE,
    token VARCHAR NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User documents table
CREATE TABLE public.user_documents (
    doc_id SERIAL PRIMARY KEY,
    national_number VARCHAR REFERENCES public.users(national_number) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    doc_number VARCHAR NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    document_status document_status DEFAULT 'active',
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE public.notifications (
    notification_id SERIAL PRIMARY KEY,
    national_number VARCHAR REFERENCES public.users(national_number) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status_type VARCHAR,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service applications table
CREATE TABLE public.service_applications (
    application_id SERIAL PRIMARY KEY,
    national_number VARCHAR REFERENCES public.users(national_number) ON DELETE CASCADE,
    service_id INTEGER REFERENCES public.services(service_id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR,
    application_status VARCHAR DEFAULT 'Pending',
    payment_status VARCHAR DEFAULT 'Unpaid',
    invoice_number VARCHAR NOT NULL,
    office_location VARCHAR NOT NULL,
    emergency_reason TEXT,
    rejection_reason TEXT,
    -- Enhanced fields from migrations
    documents_uploaded BOOLEAN DEFAULT FALSE,
    documents_verified BOOLEAN DEFAULT FALSE,
    admin_notes TEXT
);

-- Support requests table
CREATE TABLE public.support_requests (
    request_id SERIAL PRIMARY KEY,
    national_number VARCHAR REFERENCES public.users(national_number) ON DELETE CASCADE,
    subject VARCHAR,
    message TEXT,
    status VARCHAR DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded documents table
CREATE TABLE public.uploaded_documents (
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
    verified_by VARCHAR(50) REFERENCES public.admin_users(username) ON DELETE SET NULL
);

-- Driving exams table
CREATE TABLE public.driving_exams (
    exam_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES public.service_applications(application_id) ON DELETE CASCADE,
    national_number VARCHAR(50) NOT NULL REFERENCES public.users(national_number) ON DELETE CASCADE,
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

-- Print queue table
CREATE TABLE public.print_queue (
    queue_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES public.service_applications(application_id) ON DELETE CASCADE,
    national_number VARCHAR(20) NOT NULL REFERENCES public.users(national_number) ON DELETE CASCADE,
    user_full_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_id INTEGER NOT NULL REFERENCES public.services(service_id) ON DELETE CASCADE,
    approval_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    print_status VARCHAR(20) DEFAULT 'pending_print' CHECK (print_status IN ('pending_print', 'printed')),
    printed_at TIMESTAMP WITH TIME ZONE NULL,
    printed_by VARCHAR(50) NULL REFERENCES public.admin_users(username) ON DELETE SET NULL,
    office_location VARCHAR(100) NOT NULL,
    document_id INTEGER NULL REFERENCES public.user_documents(doc_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Create Indexes

```sql
-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Services table indexes
CREATE INDEX IF NOT EXISTS idx_services_eligibility_type ON public.services(eligibility_type);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

-- Admin logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_username ON public.admin_logs(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Service applications indexes
CREATE INDEX IF NOT EXISTS idx_service_applications_national_number ON public.service_applications(national_number);
CREATE INDEX IF NOT EXISTS idx_service_applications_service_id ON public.service_applications(service_id);
CREATE INDEX IF NOT EXISTS idx_service_applications_status ON public.service_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_service_applications_submitted_at ON public.service_applications(submitted_at DESC);

-- User documents indexes
CREATE INDEX IF NOT EXISTS idx_user_documents_national_number ON public.user_documents(national_number);
CREATE INDEX IF NOT EXISTS idx_user_documents_doc_type ON public.user_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(document_status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_national_number ON public.notifications(national_number);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Uploaded documents indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_application_id ON public.uploaded_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_status ON public.uploaded_documents(upload_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_uploaded_at ON public.uploaded_documents(uploaded_at DESC);

-- Driving exams indexes
CREATE INDEX IF NOT EXISTS idx_driving_exams_application_id ON public.driving_exams(application_id);
CREATE INDEX IF NOT EXISTS idx_driving_exams_national_number ON public.driving_exams(national_number);
CREATE INDEX IF NOT EXISTS idx_driving_exams_status ON public.driving_exams(exam_status);
CREATE INDEX IF NOT EXISTS idx_driving_exams_exam_date ON public.driving_exams(exam_date);

-- Print queue indexes
CREATE INDEX IF NOT EXISTS idx_print_queue_status ON public.print_queue(print_status);
CREATE INDEX IF NOT EXISTS idx_print_queue_approval_date ON public.print_queue(approval_date DESC);
CREATE INDEX IF NOT EXISTS idx_print_queue_service_type ON public.print_queue(service_type);
CREATE INDEX IF NOT EXISTS idx_print_queue_office ON public.print_queue(office_location);
CREATE INDEX IF NOT EXISTS idx_print_queue_national_number ON public.print_queue(national_number);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_print_queue_unique_application ON public.print_queue(application_id);
```

### 5. Create Triggers and Functions

```sql
-- =====================================================
-- CREATE UTILITY FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for driving_exams updated_at
CREATE TRIGGER update_driving_exams_updated_at 
    BEFORE UPDATE ON public.driving_exams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for print queue updated_at
CREATE OR REPLACE FUNCTION update_print_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for print_queue updated_at
CREATE TRIGGER trigger_update_print_queue_updated_at
    BEFORE UPDATE ON public.print_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_print_queue_updated_at();
```

---

## Backup Procedures

### 1. Full Database Backup

```sql
-- =====================================================
-- FULL DATABASE BACKUP PROCEDURES
-- =====================================================

-- Command line backup (run from terminal)
-- pg_dump -h [host] -U [username] -d [database] -f moi_platform_backup_$(date +%Y%m%d_%H%M%S).sql

-- Schema-only backup
-- pg_dump -h [host] -U [username] -d [database] -s -f moi_platform_schema_$(date +%Y%m%d_%H%M%S).sql

-- Data-only backup
-- pg_dump -h [host] -U [username] -d [database] -a -f moi_platform_data_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Table-Specific Backup Queries

```sql
-- =====================================================
-- TABLE-SPECIFIC BACKUP QUERIES
-- =====================================================

-- Backup users table
COPY public.users TO '/backup/users_backup.csv' WITH CSV HEADER;

-- Backup service_applications table
COPY public.service_applications TO '/backup/service_applications_backup.csv' WITH CSV HEADER;

-- Backup user_documents table
COPY public.user_documents TO '/backup/user_documents_backup.csv' WITH CSV HEADER;

-- Backup admin_users table
COPY public.admin_users TO '/backup/admin_users_backup.csv' WITH CSV HEADER;

-- Backup services table
COPY public.services TO '/backup/services_backup.csv' WITH CSV HEADER;

-- Backup notifications table
COPY public.notifications TO '/backup/notifications_backup.csv' WITH CSV HEADER;

-- Backup uploaded_documents table
COPY public.uploaded_documents TO '/backup/uploaded_documents_backup.csv' WITH CSV HEADER;

-- Backup driving_exams table
COPY public.driving_exams TO '/backup/driving_exams_backup.csv' WITH CSV HEADER;

-- Backup print_queue table
COPY public.print_queue TO '/backup/print_queue_backup.csv' WITH CSV HEADER;

-- Backup admin_logs table
COPY public.admin_logs TO '/backup/admin_logs_backup.csv' WITH CSV HEADER;

-- Backup password_reset_tokens table
COPY public.password_reset_tokens TO '/backup/password_reset_tokens_backup.csv' WITH CSV HEADER;

-- Backup support_requests table
COPY public.support_requests TO '/backup/support_requests_backup.csv' WITH CSV HEADER;
```

### 3. Incremental Backup Queries

```sql
-- =====================================================
-- INCREMENTAL BACKUP QUERIES
-- =====================================================

-- Backup recent service applications (last 7 days)
COPY (
    SELECT * FROM public.service_applications 
    WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days'
) TO '/backup/recent_applications.csv' WITH CSV HEADER;

-- Backup recent notifications (last 30 days)
COPY (
    SELECT * FROM public.notifications 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
) TO '/backup/recent_notifications.csv' WITH CSV HEADER;

-- Backup recent admin logs (last 30 days)
COPY (
    SELECT * FROM public.admin_logs 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
) TO '/backup/recent_admin_logs.csv' WITH CSV HEADER;

-- Backup recent document uploads (last 7 days)
COPY (
    SELECT * FROM public.uploaded_documents 
    WHERE uploaded_at >= CURRENT_DATE - INTERVAL '7 days'
) TO '/backup/recent_uploads.csv' WITH CSV HEADER;
```

---

## Restoration Procedures

### 1. Full Database Restoration

```sql
-- =====================================================
-- FULL DATABASE RESTORATION
-- =====================================================

-- Command line restoration (run from terminal)
-- psql -h [host] -U [username] -d [database] -f moi_platform_backup.sql

-- Restore with clean database
-- psql -h [host] -U [username] -d [database] -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
-- psql -h [host] -U [username] -d [database] -f moi_platform_backup.sql
```

### 2. Table-Specific Restoration

```sql
-- =====================================================
-- TABLE-SPECIFIC RESTORATION QUERIES
-- =====================================================

-- Restore users table
TRUNCATE public.users CASCADE;
COPY public.users FROM '/backup/users_backup.csv' WITH CSV HEADER;

-- Restore services table
TRUNCATE public.services CASCADE;
COPY public.services FROM '/backup/services_backup.csv' WITH CSV HEADER;

-- Restore admin_users table
TRUNCATE public.admin_users CASCADE;
COPY public.admin_users FROM '/backup/admin_users_backup.csv' WITH CSV HEADER;

-- Restore service_applications table
TRUNCATE public.service_applications CASCADE;
COPY public.service_applications FROM '/backup/service_applications_backup.csv' WITH CSV HEADER;

-- Restore user_documents table
TRUNCATE public.user_documents CASCADE;
COPY public.user_documents FROM '/backup/user_documents_backup.csv' WITH CSV HEADER;

-- Restore notifications table
TRUNCATE public.notifications CASCADE;
COPY public.notifications FROM '/backup/notifications_backup.csv' WITH CSV HEADER;

-- Restore uploaded_documents table
TRUNCATE public.uploaded_documents CASCADE;
COPY public.uploaded_documents FROM '/backup/uploaded_documents_backup.csv' WITH CSV HEADER;

-- Restore driving_exams table
TRUNCATE public.driving_exams CASCADE;
COPY public.driving_exams FROM '/backup/driving_exams_backup.csv' WITH CSV HEADER;

-- Restore print_queue table
TRUNCATE public.print_queue CASCADE;
COPY public.print_queue FROM '/backup/print_queue_backup.csv' WITH CSV HEADER;

-- Restore admin_logs table
TRUNCATE public.admin_logs CASCADE;
COPY public.admin_logs FROM '/backup/admin_logs_backup.csv' WITH CSV HEADER;

-- Restore password_reset_tokens table
TRUNCATE public.password_reset_tokens CASCADE;
COPY public.password_reset_tokens FROM '/backup/password_reset_tokens_backup.csv' WITH CSV HEADER;

-- Restore support_requests table
TRUNCATE public.support_requests CASCADE;
COPY public.support_requests FROM '/backup/support_requests_backup.csv' WITH CSV HEADER;
```

### 3. Sequence Reset After Restoration

```sql
-- =====================================================
-- RESET SEQUENCES AFTER RESTORATION
-- =====================================================

-- Reset all sequences to correct values
SELECT setval('public.services_service_id_seq', (SELECT MAX(service_id) FROM public.services));
SELECT setval('public.admin_users_admin_id_seq', (SELECT MAX(admin_id) FROM public.admin_users));
SELECT setval('public.service_applications_application_id_seq', (SELECT MAX(application_id) FROM public.service_applications));
SELECT setval('public.user_documents_doc_id_seq', (SELECT MAX(doc_id) FROM public.user_documents));
SELECT setval('public.notifications_notification_id_seq', (SELECT MAX(notification_id) FROM public.notifications));
SELECT setval('public.uploaded_documents_upload_id_seq', (SELECT MAX(upload_id) FROM public.uploaded_documents));
SELECT setval('public.driving_exams_exam_id_seq', (SELECT MAX(exam_id) FROM public.driving_exams));
SELECT setval('public.print_queue_queue_id_seq', (SELECT MAX(queue_id) FROM public.print_queue));
SELECT setval('public.admin_logs_log_id_seq', (SELECT MAX(log_id) FROM public.admin_logs));
SELECT setval('public.password_reset_tokens_token_id_seq', (SELECT MAX(token_id) FROM public.password_reset_tokens));
SELECT setval('public.support_requests_request_id_seq', (SELECT MAX(request_id) FROM public.support_requests));
```

---

## Data Migration Scripts

### 1. User Data Migration

```sql
-- =====================================================
-- USER DATA MIGRATION SCRIPTS
-- =====================================================

-- Migrate users from old system (example structure)
INSERT INTO public.users (
    national_number, full_name, password_hash, phone_number, 
    email, gender, address, state, birth_date, user_type
)
SELECT 
    old_id, full_name, password, phone, 
    email, gender, address, state, birth_date, 'national'
FROM old_users_table
WHERE old_id IS NOT NULL
ON CONFLICT (national_number) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    email = EXCLUDED.email,
    gender = EXCLUDED.gender,
    address = EXCLUDED.address,
    state = EXCLUDED.state,
    birth_date = EXCLUDED.birth_date;
```

### 2. Document Migration

```sql
-- =====================================================
-- DOCUMENT MIGRATION SCRIPTS
-- =====================================================

-- Migrate existing documents
INSERT INTO public.user_documents (
    national_number, doc_type, doc_number, issue_date, 
    expiry_date, document_status, qr_code
)
SELECT 
    user_id, 
    CASE 
        WHEN doc_type = 'passport' THEN 'passport'::document_type
        WHEN doc_type = 'id' THEN 'national_id'::document_type
        WHEN doc_type = 'birth' THEN 'birth_certificate'::document_type
        WHEN doc_type = 'license' THEN 'driver_license'::document_type
        ELSE 'national_id'::document_type
    END,
    document_number, issue_date, expiry_date, 'active'::document_status, qr_code
FROM old_documents_table
WHERE user_id IS NOT NULL;
```

### 3. Service Migration

```sql
-- =====================================================
-- SERVICE MIGRATION SCRIPTS
-- =====================================================

-- Insert default services if not exists
INSERT INTO public.services (service_name, description, fee, processing_time, required_documents, is_active, eligibility_type) 
VALUES 
    ('Passport Service', 'Apply for a new passport or renew existing one', 2500.00, '10-15 business days', 
     ARRAY['National ID', 'Birth Certificate', 'Proof of Address', 'Photos'], TRUE, 'both'),
    ('National ID Service', 'Apply for a national identification card', 1000.00, '5-7 business days', 
     ARRAY['Birth Certificate', 'Proof of Address', 'Photos'], TRUE, 'national_only'),
    ('Birth Certificate Service', 'Request a birth certificate', 500.00, '3-5 business days', 
     ARRAY['Hospital Records', 'Parents IDs', 'Witness Statements'], TRUE, 'both'),
    ('Driver License Service', 'Apply for a new driver license', 1500.00, '7-10 business days', 
     ARRAY['National ID', 'Medical Certificate', 'Driving Test Results', 'Photos'], TRUE, 'both'),
    ('Marriage Certificate Service', 'Request a marriage certificate', 750.00, '5-7 business days', 
     ARRAY['National IDs of Both Parties', 'Witness IDs', 'Religious/Civil Documentation'], TRUE, 'both')
ON CONFLICT (service_id) DO NOTHING;
```

---

## Maintenance and Optimization

### 1. Database Maintenance Queries

```sql
-- =====================================================
-- DATABASE MAINTENANCE QUERIES
-- =====================================================

-- Analyze all tables for query optimization
ANALYZE;

-- Vacuum all tables to reclaim space
VACUUM;

-- Full vacuum with analyze (use during maintenance windows)
VACUUM FULL ANALYZE;

-- Reindex all tables
REINDEX DATABASE current_database();

-- Update table statistics
ANALYZE public.users;
ANALYZE public.service_applications;
ANALYZE public.user_documents;
ANALYZE public.notifications;
ANALYZE public.uploaded_documents;
ANALYZE public.driving_exams;
ANALYZE public.print_queue;
ANALYZE public.admin_logs;
```

### 2. Performance Monitoring Queries

```sql
-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements extension)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / (n_live_tup + n_dead_tup), 2) AS dead_percentage
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY dead_percentage DESC;
```

### 3. Data Cleanup Queries

```sql
-- =====================================================
-- DATA CLEANUP QUERIES
-- =====================================================

-- Clean up expired password reset tokens
DELETE FROM public.password_reset_tokens 
WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE;

-- Clean up old notifications (older than 6 months)
DELETE FROM public.notifications 
WHERE created_at < CURRENT_DATE - INTERVAL '6 months' AND is_read = TRUE;

-- Clean up old admin logs (older than 1 year)
DELETE FROM public.admin_logs 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- Clean up cancelled/rejected applications older than 1 year
DELETE FROM public.service_applications 
WHERE application_status IN ('Cancelled', 'Rejected') 
AND submitted_at < CURRENT_DATE - INTERVAL '1 year';

-- Clean up expired documents
UPDATE public.user_documents 
SET document_status = 'expired'::document_status
WHERE expiry_date < CURRENT_DATE AND document_status = 'active'::document_status;
```

---

## Emergency Recovery Procedures

### 1. Critical System Recovery

```sql
-- =====================================================
-- CRITICAL SYSTEM RECOVERY PROCEDURES
-- =====================================================

-- Emergency admin user creation (if all admins are locked out)
INSERT INTO public.admin_users (username, password, full_name, is_active)
VALUES ('emergency_admin', 'temp_password_123', 'Emergency Administrator', TRUE)
ON CONFLICT (username) DO UPDATE SET
    password = EXCLUDED.password,
    is_active = TRUE;

-- Reset all user passwords (emergency only)
UPDATE public.users 
SET password_hash = 'emergency_reset_required'
WHERE national_number IN (
    SELECT national_number FROM public.users 
    WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
);

-- Disable all services temporarily
UPDATE public.services SET is_active = FALSE;

-- Enable only critical services
UPDATE public.services 
SET is_active = TRUE 
WHERE service_name IN ('National ID Service', 'Passport Service');
```

### 2. Data Corruption Recovery

```sql
-- =====================================================
-- DATA CORRUPTION RECOVERY
-- =====================================================

-- Check for data integrity issues
SELECT 
    'Orphaned service applications' as issue,
    COUNT(*) as count
FROM public.service_applications sa
LEFT JOIN public.users u ON sa.national_number = u.national_number
WHERE u.national_number IS NULL

UNION ALL

SELECT 
    'Orphaned user documents' as issue,
    COUNT(*) as count
FROM public.user_documents ud
LEFT JOIN public.users u ON ud.national_number = u.national_number
WHERE u.national_number IS NULL

UNION ALL

SELECT 
    'Orphaned notifications' as issue,
    COUNT(*) as count
FROM public.notifications n
LEFT JOIN public.users u ON n.national_number = u.national_number
WHERE u.national_number IS NULL;

-- Clean up orphaned records
DELETE FROM public.service_applications 
WHERE national_number NOT IN (SELECT national_number FROM public.users);

DELETE FROM public.user_documents 
WHERE national_number NOT IN (SELECT national_number FROM public.users);

DELETE FROM public.notifications 
WHERE national_number NOT IN (SELECT national_number FROM public.users);

-- Rebuild foreign key constraints if needed
ALTER TABLE public.service_applications 
DROP CONSTRAINT IF EXISTS service_applications_national_number_fkey,
ADD CONSTRAINT service_applications_national_number_fkey 
FOREIGN KEY (national_number) REFERENCES public.users(national_number) ON DELETE CASCADE;
```

### 3. Point-in-Time Recovery

```sql
-- =====================================================
-- POINT-IN-TIME RECOVERY PROCEDURES
-- =====================================================

-- Create recovery point before major operations
SELECT pg_create_restore_point('before_major_update');

-- Recovery commands (run from command line)
-- pg_basebackup -h [host] -D /recovery/base_backup -U [username] -v -P -W
-- 
-- To recover to specific time:
-- 1. Stop PostgreSQL service
-- 2. Replace data directory with backup
-- 3. Create recovery.conf with:
--    restore
---

## Database Functions

### 1. Authentication Functions

```sql
-- =====================================================
-- AUTHENTICATION FUNCTIONS
-- =====================================================

-- User login function
CREATE OR REPLACE FUNCTION public.custom_login(p_national_number character varying, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user public.users%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Try to find the user
    SELECT * INTO v_user 
    FROM public.users 
    WHERE national_number = p_national_number;
    
    -- Check if user exists and password matches
    IF v_user.national_number IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    IF v_user.password_hash <> p_password THEN -- In production, use proper password verification
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    -- Login successful
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Login successful',
        'full_name', v_user.full_name,
        'national_number', v_user.national_number
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$function$;

-- Enhanced auth login function
CREATE OR REPLACE FUNCTION public.handle_auth_login(p_national_number character varying, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user RECORD;
    v_response JSON;
BEGIN
    -- Find user by national number
    SELECT * INTO v_user FROM public.users 
    WHERE national_number = p_national_number;
    
    -- Check if user exists and password matches
    IF v_user.national_number IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    IF v_user.password_hash != p_password THEN
        RETURN json_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    -- Return user data
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.national_number, 
            'fullName', v_user.full_name,
            'nationalNumber', v_user.national_number,
            'isProfileComplete', v_user.profile_completed
        )
    );
END;
$function$;

-- Admin login function
CREATE OR REPLACE FUNCTION public.admin_login(p_username character varying, p_password character varying)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_admin RECORD;
BEGIN
    SELECT * INTO v_admin
    FROM public.admin_users
    WHERE username = p_username
    AND password = p_password
    AND is_active = true;
    
    IF v_admin.admin_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid credentials');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'admin', json_build_object(
            'adminId', v_admin.admin_id,
            'username', v_admin.username,
            'fullName', v_admin.full_name
        )
    );
END;
$function$;

-- User registration function
CREATE OR REPLACE FUNCTION public.register_user(
    p_national_number character varying, 
    p_full_name character varying, 
    p_phone_number character varying, 
    p_password text,
    p_gender character varying DEFAULT NULL, 
    p_state character varying DEFAULT NULL, 
    p_address character varying DEFAULT NULL, 
    p_email character varying DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if user already exists
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE national_number = p_national_number
    ) INTO user_exists;
    
    IF user_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'User already exists');
    END IF;
    
    -- Insert new user with additional fields
    INSERT INTO public.users (
        national_number, 
        full_name, 
        phone_number, 
        password_hash,
        gender,
        state,
        address,
        email,
        profile_completed
    ) VALUES (
        p_national_number,
        p_full_name,
        p_phone_number,
        p_password, -- In production, this would be properly hashed
        p_gender,
        p_state,
        p_address,
        p_email,
        true -- Since we're collecting all info now
    );
    
    RETURN jsonb_build_object('success', true, 'message', 'User registered successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$function$;
```

### 2. Data Access Functions

```sql
-- =====================================================
-- DATA ACCESS FUNCTIONS
-- =====================================================

-- Get services function
CREATE OR REPLACE FUNCTION public.get_services()
RETURNS SETOF services
LANGUAGE sql
SECURITY DEFINER
AS $function$
    SELECT * FROM public.services WHERE is_active = true;
$function$;

-- Get user documents function
CREATE OR REPLACE FUNCTION public.get_user_documents(p_national_number character varying)
RETURNS SETOF user_documents
LANGUAGE sql
SECURITY DEFINER
AS $function$
    SELECT * FROM public.user_documents 
    WHERE national_number = p_national_number
    ORDER BY created_at DESC;
$function$;

-- Get user notifications function
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_national_number character varying)
RETURNS SETOF notifications
LANGUAGE sql
SECURITY DEFINER
AS $function$
    SELECT * FROM public.notifications 
    WHERE national_number = p_national_number
    ORDER BY created_at DESC;
$function$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id integer, p_national_number character varying)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE notification_id = p_notification_id
    AND national_number = p_national_number;
    
    RETURN FOUND;
END;
$function$;
```

### 3. Business Logic Functions

```sql
-- =====================================================
-- BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Submit service application function
CREATE OR REPLACE FUNCTION public.submit_service_application(
    p_national_number character varying, 
    p_service_id integer, 
    p_invoice_number character varying, 
    p_office_location character varying, 
    p_is_emergency boolean, 
    p_emergency_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_application_id INTEGER;
BEGIN
    -- Insert application
    INSERT INTO public.service_applications (
        national_number,
        service_id,
        invoice_number,
        office_location,
        emergency_reason
    ) VALUES (
        p_national_number,
        p_service_id,
        p_invoice_number,
        p_office_location,
        CASE WHEN p_is_emergency THEN p_emergency_reason ELSE NULL END
    ) RETURNING application_id INTO v_application_id;
    
    -- Create notification for the user
    INSERT INTO public.notifications (
        national_number,
        title,
        message,
        status_type
    ) VALUES (
        p_national_number,
        'Application Submitted',
        'Your service application has been submitted and is pending review.',
        'pending'
    );
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'applicationId', v_application_id,
        'message', 'Application submitted successfully'
    );
END;
$function$;

-- Get admin applications function
CREATE OR REPLACE FUNCTION public.get_admin_applications(
    p_status character varying DEFAULT NULL, 
    p_service_id integer DEFAULT NULL, 
    p_offset integer DEFAULT 0, 
    p_limit integer DEFAULT 20
)
RETURNS TABLE(
    application_id integer, 
    national_number character varying, 
    service_id integer, 
    service_name character varying, 
    submitted_at timestamp without time zone, 
    reviewed_at timestamp without time zone, 
    application_status character varying, 
    payment_status character varying, 
    office_location character varying, 
    invoice_number character varying, 
    emergency_reason text, 
    rejection_reason text, 
    reviewed_by character varying, 
    full_name character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.application_id,
        sa.national_number,
        sa.service_id,
        s.service_name,
        sa.submitted_at,
        sa.reviewed_at,
        sa.application_status,
        sa.payment_status,
        sa.office_location,
        sa.invoice_number,
        sa.emergency_reason,
        sa.rejection_reason,
        sa.reviewed_by,
        u.full_name
    FROM 
        public.service_applications sa
    JOIN 
        public.services s ON sa.service_id = s.service_id
    JOIN 
        public.users u ON sa.national_number = u.national_number
    WHERE
        (p_status IS NULL OR sa.application_status = p_status) AND
        (p_service_id IS NULL OR sa.service_id = p_service_id)
    ORDER BY 
        CASE WHEN sa.application_status = 'Pending' THEN 0 ELSE 1 END,
        sa.submitted_at DESC
    OFFSET p_offset
    LIMIT p_limit;
END;
$function$;

-- Admin review application function
CREATE OR REPLACE FUNCTION public.admin_review_application(
    p_admin_username character varying, 
    p_application_id integer, 
    p_approve boolean, 
    p_rejection_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_application RECORD;
    v_service_name VARCHAR;
    v_national_number VARCHAR;
    v_doc_type document_type;
    v_doc_id INTEGER;
    v_current_date DATE := CURRENT_DATE;
    v_expiry_date DATE;
BEGIN
    -- Get application
    SELECT * INTO v_application 
    FROM public.service_applications 
    WHERE application_id = p_application_id;
    
    IF v_application.application_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Application not found');
    END IF;
    
    v_national_number := v_application.national_number;
    
    -- Get service name
    SELECT service_name INTO v_service_name 
    FROM public.services 
    WHERE service_id = v_application.service_id;
    
    -- Update application status
    UPDATE public.service_applications
    SET 
        application_status = CASE WHEN p_approve THEN 'Approved' ELSE 'Rejected' END,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = p_admin_username,
        rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END
    WHERE application_id = p_application_id;
    
    -- Log admin action
    INSERT INTO public.admin_logs (
        admin_username,
        action,
        ip_address
    ) VALUES (
        p_admin_username,
        CASE WHEN p_approve 
            THEN 'Approved application #' || p_application_id 
            ELSE 'Rejected application #' || p_application_id 
        END,
        '127.0.0.1' -- In production, this would be the actual IP
    );
    
    -- Create notification for user
    INSERT INTO public.notifications (
        national_number,
        title,
        message,
        status_type
    ) VALUES (
        v_national_number,
        CASE WHEN p_approve 
            THEN 'Application Approved' 
            ELSE 'Application Rejected' 
        END,
        CASE WHEN p_approve 
            THEN 'Your ' || v_service_name || ' application has been approved.'
            ELSE 'Your ' || v_service_name || ' application has been rejected. Reason: ' || p_rejection_reason
        END,
        CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END
    );
    
    -- If approved, create document and add to print queue
    IF p_approve THEN
        -- Determine doc_type based on service
        CASE 
            WHEN v_service_name ILIKE '%passport%' THEN
                v_doc_type := 'passport'::document_type;
                v_expiry_date := v_current_date + INTERVAL '10 years';
            WHEN v_service_name ILIKE '%id%' OR v_service_name ILIKE '%national%' THEN
                v_doc_type := 'national_id'::document_type;
                v_expiry_date := v_current_date + INTERVAL '5 years';
            WHEN v_service_name ILIKE '%birth%' THEN
                v_doc_type := 'birth_certificate'::document_type;
                v_expiry_date := NULL; -- No expiry for birth certificates
            WHEN v_service_name ILIKE '%driver%' OR v_service_name ILIKE '%license%' THEN
                v_doc_type := 'driver_license'::document_type;
                v_expiry_date := v_current_date + INTERVAL '5 years';
            ELSE
                v_doc_type := 'national_id'::document_type;
                v_expiry_date := v_current_date + INTERVAL '5 years';
        END CASE;
        
        -- Generate a unique document number based on type and date
        INSERT INTO public.user_documents (
            national_number,
            doc_type,
            doc_number,
            issue_date,
            expiry_date,
            document_status,
            qr_code
        ) VALUES (
            v_national_number,
            v_doc_type,
            UPPER(SUBSTRING(v_doc_type::text, 1, 2)) || '-' || 
                TO_CHAR(v_current_date, 'YYMMDD') || '-' || 
                LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
            v_current_date,
            v_expiry_date,
            'active'::document_status,
            'https://verify.moi.gov.sd/' || v_application.application_id
        ) RETURNING doc_id INTO v_doc_id;
        
        -- Add to print queue
        INSERT INTO public.print_queue (
            application_id,
            national_number,
            user_full_name,
            service_type,
            service_id,
            office_location,
            document_id
        ) SELECT 
            v_application.application_id,
            v_application.national_number,
            u.full_name,
            v_service_name,
            v_application.service_id,
            v_application.office_location,
            v_doc_id
        FROM public.users u 
        WHERE u.national_number = v_application.national_number;
        
        -- Notify about new document
        INSERT INTO public.notifications (
            national_number,
            title,
            message,
            status_type
        ) VALUES (
            v_national_number,
            'Document Ready for Collection',
            'Your new ' || v_doc_type::text || ' is ready for collection at ' || v_application.office_location || '.',
            'approved'
        );
    END IF;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'message', CASE WHEN p_approve 
                     THEN 'Application approved. Document created and queued for printing.' 
                     ELSE 'Application rejected.' 
                   END,
        'docId', v_doc_id
    );
END;
$function$;
```

---

## Row Level Security Setup

```sql
-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Services table policies (public read access)
CREATE POLICY "Allow public read access to services" ON public.services
    FOR SELECT USING (true);

-- Users table policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (national_number = current_setting('app.current_user_id', true));

-- Service applications policies
CREATE POLICY "Users can view their own applications" ON public.service_applications
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own applications" ON public.service_applications
    FOR INSERT WITH CHECK (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can manage all applications" ON public.service_applications
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- User documents policies
CREATE POLICY "Users can view their own documents" ON public.user_documents
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can manage all documents" ON public.user_documents
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (national_number = current_setting('app.current_user_id', true));

-- Admin tables policies
CREATE POLICY "Allow admin authentication" ON public.admin_users
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage admin users" ON public.admin_users
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true)
    WITH CHECK (current_setting('app.is_admin', true)::boolean = true);

CREATE POLICY "Admins can manage admin logs" ON public.admin_logs
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Print queue policies
CREATE POLICY "Admins can manage print queue" ON public.print_queue
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Uploaded documents policies
CREATE POLICY "Users can manage their application documents" ON public.uploaded_documents
    FOR ALL USING (
        application_id IN (
            SELECT application_id FROM public.service_applications 
            WHERE national_number = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Admins can manage all uploaded documents" ON public.uploaded_documents
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Driving exams policies
CREATE POLICY "Users can view their own exams" ON public.driving_exams
    FOR SELECT USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can manage all exams" ON public.driving_exams
    FOR ALL USING (current_setting('app.is_admin', true)::boolean = true);

-- Password reset tokens policies
CREATE POLICY "Users can manage their own tokens" ON public.password_reset_tokens
    FOR ALL USING (national_number = current_setting('app.current_user_id', true));

-- Support requests policies
CREATE POLICY "Users can manage their own support requests" ON public.support_requests
    FOR ALL USING (national_number = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can view all support requests" ON public.support_requests
    FOR SELECT USING (current_setting('app.is_admin', true)::boolean = true);

-- Grant necessary permissions
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.service_applications TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.uploaded_documents TO authenticated;
GRANT SELECT, UPDATE ON public.driving_exams TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.print_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_reset_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## Automated Backup Scripts

### 1. Daily Backup Script

```bash
#!/bin/bash
# =====================================================
# DAILY BACKUP SCRIPT
# =====================================================

# Configuration
DB_HOST="your-supabase-host"
DB_NAME="postgres"
DB_USER="postgres"
BACKUP_DIR="/backups/daily"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    -f "$BACKUP_DIR/moi_platform_full_$DATE.sql" \
    --verbose --no-password

# Schema-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -s \
    -f "$BACKUP_DIR/moi_platform_schema_$DATE.sql" \
    --verbose --no-password

# Data-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -a \
    -f "$BACKUP_DIR/moi_platform_data_$DATE.sql" \
    --verbose --no-password

# Compress backups
gzip "$BACKUP_DIR/moi_platform_full_$DATE.sql"
gzip "$BACKUP_DIR/moi_platform_schema_$DATE.sql"
gzip "$BACKUP_DIR/moi_platform_data_$DATE.sql"

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

### 2. Critical Tables Backup Script

```bash
#!/bin/bash
# =====================================================
# CRITICAL TABLES BACKUP SCRIPT
# =====================================================

# Configuration
DB_HOST="your-supabase-host"
DB_NAME="postgres"
DB_USER="postgres"
BACKUP_DIR="/backups/critical"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Critical tables list
TABLES=("users" "service_applications" "user_documents" "admin_users" "services")

# Backup each critical table
for table in "${TABLES[@]}"; do
    echo "Backing up table: $table"
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
        -t "public.$table" \
        -f "$BACKUP_DIR/${table}_$DATE.sql" \
        --verbose --no-password
    
    # Also create CSV backup
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
        -c "\COPY public.$table TO '$BACKUP_DIR/${table}_$DATE.csv' WITH CSV HEADER"
done

echo "Critical tables backup completed: $DATE"
```

### 3. Incremental Backup Script

```bash
#!/bin/bash
# =====================================================
# INCREMENTAL BACKUP SCRIPT
# =====================================================

# Configuration
DB_HOST="your-supabase-host"
DB_NAME="postgres"
DB_USER="postgres"
BACKUP_DIR="/backups/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
DAYS_BACK=1

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup recent changes
echo "Creating incremental backup for last $DAYS_BACK days"

# Recent service applications
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
\COPY (
    SELECT * FROM public.service_applications 
    WHERE submitted_at >= CURRENT_DATE - INTERVAL '$DAYS_BACK days'
) TO '$BACKUP_DIR/recent_applications_$DATE.csv' WITH CSV HEADER"

# Recent notifications
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
\COPY (
    SELECT * FROM public.notifications 
    WHERE created_at >= CURRENT_DATE - INTERVAL '$DAYS_BACK days'
) TO '$BACKUP_DIR/recent_notifications_$DATE.csv' WITH CSV HEADER"

# Recent document uploads
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
\COPY (
    SELECT * FROM public.uploaded_documents 
    WHERE uploaded_at >= CURRENT_DATE - INTERVAL '$DAYS_BACK days'
) TO '$BACKUP_DIR/recent_uploads_$DATE.csv' WITH CSV HEADER"

# Recent admin logs
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
\COPY (
    SELECT * FROM public.admin_logs 
    WHERE created_at >= CURRENT_DATE - INTERVAL '$DAYS_BACK days'
) TO '$BACKUP_DIR/recent_admin_logs_$DATE.csv' WITH CSV HEADER"

echo "Incremental backup completed: $DATE"
```

---

## Disaster Recovery Checklist

### 1. Pre-Disaster Preparation
- [ ] Verify automated backups are running daily
- [ ] Test backup restoration procedures monthly
- [ ] Maintain off-site backup copies
- [ ] Document all database credentials securely
- [ ] Ensure monitoring alerts are configured
- [ ] Maintain updated contact list for emergency response

### 2. During Disaster Response
- [ ] Assess the scope of data loss or corruption
- [ ] Identify the last known good backup
- [ ] Notify stakeholders of the incident
- [ ] Implement emergency access procedures if needed
- [ ] Document all recovery actions taken
- [ ] Monitor system performance during recovery

### 3. Post-Disaster Verification
- [ ] Verify data integrity after restoration
- [ ] Test all critical system functions
- [ ] Validate user access and permissions
- [ ] Check application functionality end-to-end
- [ ] Update backup procedures based on lessons learned
- [ ] Conduct post-incident review meeting

---

## Contact Information for Emergency

**Database Administrator**: [Your DBA Contact]
**System Administrator**: [Your SysAdmin Contact]
**Project Manager**: [Your PM Contact]
**Emergency Hotline**: [Emergency Number]

---

*This document should be reviewed and updated quarterly to ensure all procedures remain current and effective.*