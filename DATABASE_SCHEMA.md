# MoI Platform - Complete Database Schema Documentation

## Project Overview
This document contains the complete database schema for the Ministry of Interior (MoI) Platform - a digital wallet application for Sudan's e-government services.

## Database Architecture
- **Database Type**: PostgreSQL (via Supabase)
- **Schema**: public
- **Authentication**: Row Level Security (RLS) enabled
- **Storage**: Supabase Storage for file uploads

## Table Relationships Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     users       │    │    services     │    │  admin_users    │
│                 │    │                 │    │                 │
│ national_number │◄───┤ service_id      │    │ admin_id        │
│ full_name       │    │ service_name    │    │ username        │
│ password_hash   │    │ description     │    │ password        │
│ phone_number    │    │ fee             │    │ full_name       │
│ email           │    │ eligibility_type│    │ is_active       │
│ user_type       │    │ required_docs   │    │ created_at      │
│ father_name     │    │ processing_time │    └─────────────────┘
│ mother_name     │    │ is_active       │
│ ...             │    └─────────────────┘
└─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│service_applications│  │ user_documents  │
│                 │    │                 │
│ application_id  │    │ doc_id          │
│ national_number │◄───┤ national_number │
│ service_id      │    │ doc_type        │
│ submitted_at    │    │ doc_number      │
│ application_status│   │ issue_date      │
│ payment_status  │    │ expiry_date     │
│ invoice_number  │    │ document_status │
│ office_location │    │ qr_code         │
│ emergency_reason│    │ created_at      │
│ rejection_reason│    └─────────────────┘
│ reviewed_at     │
│ reviewed_by     │
│ documents_uploaded│
│ documents_verified│
│ admin_notes     │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│uploaded_documents│    │  print_queue    │    │  driving_exams  │
│                 │    │                 │    │                 │
│ upload_id       │    │ queue_id        │    │ exam_id         │
│ application_id  │◄───┤ application_id  │◄───┤ application_id  │
│ document_type   │    │ national_number │    │ national_number │
│ file_name       │    │ user_full_name  │    │ exam_date       │
│ file_path       │    │ service_type    │    │ exam_time       │
│ file_size       │    │ service_id      │    │ office_location │
│ mime_type       │    │ approval_date   │    │ exam_status     │
│ upload_status   │    │ print_status    │    │ result_uploaded │
│ rejection_reason│    │ printed_at      │    │ result_file_path│
│ uploaded_at     │    │ printed_by      │    │ result_verified │
│ verified_at     │    │ office_location │    │ exam_score      │
│ verified_by     │    │ document_id     │    │ created_at      │
└─────────────────┘    │ created_at      │    │ updated_at      │
                       │ updated_at      │    └─────────────────┘
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  notifications  │    │   admin_logs    │    │password_reset_  │
│                 │    │                 │    │    tokens       │
│ notification_id │    │ log_id          │    │                 │
│ national_number │◄───┤ admin_username  │    │ token_id        │
│ title           │    │ action          │    │ national_number │◄──
│ message         │    │ ip_address      │    │ token           │
│ status_type     │    │ created_at      │    │ expires_at      │
│ is_read         │    └─────────────────┘    │ used            │
│ created_at      │                           │ created_at      │
└─────────────────┘                           └─────────────────┘

┌─────────────────┐
│support_requests │
│                 │
│ request_id      │
│ national_number │◄──
│ subject         │
│ message         │
│ status          │
│ created_at      │
└─────────────────┘
```

## Complete Table Definitions

### 1. users
**Purpose**: Core user accounts and profile information
**Primary Key**: national_number

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| national_number | VARCHAR | PRIMARY KEY | Sudanese national ID number |
| full_name | VARCHAR | NOT NULL | User's full name |
| password_hash | TEXT | NOT NULL | Hashed password |
| phone_number | VARCHAR | NOT NULL | Contact phone number |
| email | VARCHAR | NULL | Email address |
| gender | VARCHAR | NULL | User gender |
| address | TEXT | NULL | Physical address |
| state | VARCHAR | NULL | State/province |
| birth_date | DATE | NULL | Date of birth |
| profile_completed | BOOLEAN | DEFAULT FALSE | Profile completion status |
| dark_mode_enabled | BOOLEAN | DEFAULT FALSE | UI theme preference |
| language_preference | VARCHAR | DEFAULT 'en' | Language setting |
| profile_picture | TEXT | NULL | Profile image URL |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| user_type | VARCHAR(20) | DEFAULT 'national' | User classification (national/resident) |
| father_name | VARCHAR(255) | NULL | Father's name for birth certificates |
| mother_name | VARCHAR(255) | NULL | Mother's name for birth certificates |
| father_national_number | VARCHAR(50) | NULL | Father's national ID |
| mother_national_number | VARCHAR(50) | NULL | Mother's national ID |

**Indexes**:
- `idx_users_user_type` ON (user_type)

### 2. services
**Purpose**: Available government services
**Primary Key**: service_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| service_id | SERIAL | PRIMARY KEY | Unique service identifier |
| service_name | VARCHAR | NOT NULL | Service name |
| description | TEXT | NULL | Service description |
| fee | NUMERIC | NULL | Service fee amount |
| required_documents | TEXT[] | NULL | List of required documents |
| processing_time | VARCHAR | NULL | Expected processing duration |
| is_active | BOOLEAN | DEFAULT TRUE | Service availability status |
| eligibility_type | VARCHAR(20) | DEFAULT 'both' | Eligibility (national_only/resident_only/both) |

**Indexes**:
- `idx_services_eligibility_type` ON (eligibility_type)

### 3. admin_users
**Purpose**: Administrative user accounts
**Primary Key**: admin_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| admin_id | SERIAL | PRIMARY KEY | Unique admin identifier |
| username | VARCHAR(50) | UNIQUE NOT NULL | Admin username |
| password | VARCHAR(255) | NOT NULL | Admin password (hashed) |
| full_name | VARCHAR(255) | NOT NULL | Admin full name |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |

**Indexes**:
- `idx_admin_users_username` ON (username)
- `idx_admin_users_is_active` ON (is_active)

### 4. service_applications
**Purpose**: User applications for government services
**Primary Key**: application_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| application_id | SERIAL | PRIMARY KEY | Unique application identifier |
| national_number | VARCHAR | FK → users.national_number | Applicant's national ID |
| service_id | INTEGER | FK → services.service_id | Requested service |
| submitted_at | TIMESTAMP | DEFAULT NOW() | Application submission time |
| reviewed_at | TIMESTAMP | NULL | Review completion time |
| reviewed_by | VARCHAR | NULL | Reviewing admin username |
| application_status | VARCHAR | DEFAULT 'Pending' | Current status |
| payment_status | VARCHAR | DEFAULT 'Unpaid' | Payment status |
| invoice_number | VARCHAR | NOT NULL | Payment invoice reference |
| office_location | VARCHAR | NOT NULL | Service office location |
| emergency_reason | TEXT | NULL | Emergency processing reason |
| rejection_reason | TEXT | NULL | Reason for rejection |
| documents_uploaded | BOOLEAN | DEFAULT FALSE | Document upload status |
| documents_verified | BOOLEAN | DEFAULT FALSE | Document verification status |
| admin_notes | TEXT | NULL | Internal admin notes |

### 5. user_documents
**Purpose**: Digital documents owned by users
**Primary Key**: doc_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| doc_id | SERIAL | PRIMARY KEY | Unique document identifier |
| national_number | VARCHAR | FK → users.national_number | Document owner |
| doc_type | document_type | NOT NULL | Document type enum |
| doc_number | VARCHAR | NOT NULL | Official document number |
| issue_date | DATE | NOT NULL | Document issue date |
| expiry_date | DATE | NULL | Document expiration date |
| document_status | document_status | DEFAULT 'active' | Document status enum |
| qr_code | TEXT | NULL | QR code for verification |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

### 6. uploaded_documents
**Purpose**: User-uploaded document files for applications
**Primary Key**: upload_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| upload_id | SERIAL | PRIMARY KEY | Unique upload identifier |
| application_id | INTEGER | FK → service_applications.application_id | Related application |
| document_type | VARCHAR(100) | NOT NULL | Type of uploaded document |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_path | TEXT | NOT NULL | Storage path |
| file_size | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | File MIME type |
| upload_status | VARCHAR(20) | DEFAULT 'pending' | Verification status |
| rejection_reason | TEXT | NULL | Reason for rejection |
| uploaded_at | TIMESTAMP | DEFAULT NOW() | Upload timestamp |
| verified_at | TIMESTAMP | NULL | Verification timestamp |
| verified_by | VARCHAR(50) | FK → admin_users.username | Verifying admin |

**Indexes**:
- `idx_uploaded_documents_application_id` ON (application_id)
- `idx_uploaded_documents_status` ON (upload_status)

### 7. driving_exams
**Purpose**: Driving license exam management
**Primary Key**: exam_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| exam_id | SERIAL | PRIMARY KEY | Unique exam identifier |
| application_id | INTEGER | FK → service_applications.application_id | Related application |
| national_number | VARCHAR(50) | FK → users.national_number | Exam candidate |
| exam_date | DATE | NULL | Scheduled exam date |
| exam_time | TIME | NULL | Scheduled exam time |
| office_location | VARCHAR(255) | NOT NULL | Exam location |
| exam_status | VARCHAR(20) | DEFAULT 'scheduled' | Exam status |
| result_uploaded | BOOLEAN | DEFAULT FALSE | Result upload status |
| result_file_path | TEXT | NULL | Result document path |
| result_verified | BOOLEAN | DEFAULT FALSE | Result verification status |
| exam_score | INTEGER | NULL | Exam score |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**:
- `idx_driving_exams_application_id` ON (application_id)
- `idx_driving_exams_national_number` ON (national_number)
- `idx_driving_exams_status` ON (exam_status)

### 8. print_queue
**Purpose**: Queue for approved documents ready for printing
**Primary Key**: queue_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| queue_id | SERIAL | PRIMARY KEY | Unique queue identifier |
| application_id | INTEGER | FK → service_applications.application_id | Related application |
| national_number | VARCHAR(20) | FK → users.national_number | Document owner |
| user_full_name | VARCHAR(255) | NOT NULL | User name (cached) |
| service_type | VARCHAR(100) | NOT NULL | Service type (cached) |
| service_id | INTEGER | FK → services.service_id | Service reference |
| approval_date | TIMESTAMP | DEFAULT NOW() | Approval timestamp |
| print_status | VARCHAR(20) | DEFAULT 'pending_print' | Print status |
| printed_at | TIMESTAMP | NULL | Print completion time |
| printed_by | VARCHAR(50) | FK → admin_users.username | Printing admin |
| office_location | VARCHAR(100) | NOT NULL | Collection office |
| document_id | INTEGER | FK → user_documents.doc_id | Created document |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**:
- `idx_print_queue_status` ON (print_status)
- `idx_print_queue_approval_date` ON (approval_date DESC)
- `idx_print_queue_service_type` ON (service_type)
- `idx_print_queue_office` ON (office_location)
- `idx_print_queue_national_number` ON (national_number)
- `idx_print_queue_unique_application` UNIQUE ON (application_id)

### 9. notifications
**Purpose**: System notifications for users
**Primary Key**: notification_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_id | SERIAL | PRIMARY KEY | Unique notification identifier |
| national_number | VARCHAR | FK → users.national_number | Notification recipient |
| title | VARCHAR | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| status_type | VARCHAR | NULL | Notification category |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 10. admin_logs
**Purpose**: Administrative action logging
**Primary Key**: log_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| log_id | SERIAL | PRIMARY KEY | Unique log identifier |
| admin_username | VARCHAR | NOT NULL | Acting admin username |
| action | TEXT | NOT NULL | Action description |
| ip_address | VARCHAR(45) | NOT NULL | Admin IP address |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes**:
- `idx_admin_logs_admin_username` ON (admin_username)
- `idx_admin_logs_created_at` ON (created_at)

### 11. password_reset_tokens
**Purpose**: Password reset token management
**Primary Key**: token_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| token_id | SERIAL | PRIMARY KEY | Unique token identifier |
| national_number | VARCHAR | FK → users.national_number | User requesting reset |
| token | VARCHAR | NOT NULL | Reset token |
| expires_at | TIMESTAMP | NOT NULL | Token expiration time |
| used | BOOLEAN | DEFAULT FALSE | Token usage status |
| created_at | TIMESTAMP | DEFAULT NOW() | Token creation time |

### 12. support_requests
**Purpose**: User support and help requests
**Primary Key**: request_id

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| request_id | SERIAL | PRIMARY KEY | Unique request identifier |
| national_number | VARCHAR | FK → users.national_number | Requesting user |
| subject | VARCHAR | NULL | Request subject |
| message | TEXT | NULL | Request message |
| status | VARCHAR | DEFAULT 'Open' | Request status |
| created_at | TIMESTAMP | DEFAULT NOW() | Request creation time |

## Enum Types

### document_type
```sql
CREATE TYPE document_type AS ENUM (
    'passport',
    'national_id', 
    'birth_certificate',
    'driver_license'
);
```

### document_status
```sql
CREATE TYPE document_status AS ENUM (
    'active',
    'expired',
    'pending',
    'cancelled'
);
```

### doc_type
```sql
CREATE TYPE doc_type AS ENUM (
    'passport',
    'id_card',
    'birth_certificate',
    'marriage_certificate'
);
```

## Database Functions

### Authentication Functions
- `custom_login(p_national_number, p_password)` - User authentication
- `handle_auth_login(p_national_number, p_password)` - Enhanced auth with user data
- `admin_login(p_username, p_password)` - Admin authentication
- `register_user(...)` - User registration with profile data

### Data Access Functions
- `get_services()` - Retrieve active services
- `get_user_documents(p_national_number)` - User's documents
- `get_user_notifications(p_national_number)` - User notifications
- `get_admin_applications(...)` - Admin application management

### Business Logic Functions
- `submit_service_application(...)` - Service application submission
- `admin_review_application(...)` - Application approval/rejection
- `mark_notification_read(...)` - Notification management

## Row Level Security (RLS) Policies

### Users Table
- Users can view their own data only
- Temporary permissive policy for testing

### Service Applications
- Users can view/insert their own applications
- Admins can manage all applications

### Documents
- Users can view their own documents
- Admins have full access

### Admin Tables
- Only authenticated admins can access
- Admin context required via `app.is_admin` setting

## Storage Configuration

### Supabase Storage Buckets
- `documents` - User uploaded documents
- `profile-pictures` - User profile images
- `exam-results` - Driving exam result files

### Storage Policies
- Users can upload to their own folders
- Admins can access all storage areas
- File type restrictions enforced

## Performance Considerations

### Indexing Strategy
- Primary keys automatically indexed
- Foreign keys indexed for join performance
- Status fields indexed for filtering
- Date fields indexed for sorting
- Composite indexes for common query patterns

### Query Optimization
- Use of prepared statements in functions
- Efficient pagination with OFFSET/LIMIT
- Proper use of EXPLAIN ANALYZE for query tuning

## Security Features

### Authentication Security
- Password hashing (to be implemented with proper bcrypt)
- JWT token-based authentication
- Session management via Supabase Auth

### Data Protection
- Row Level Security on all tables
- Admin privilege separation
- Audit logging for admin actions
- Input validation in functions

### Access Control
- Role-based access (user/admin)
- Resource-level permissions
- IP address logging for admin actions

## Backup and Recovery Strategy

### Automated Backups
- Daily full database backups
- Point-in-time recovery capability
- Cross-region backup replication

### Manual Backup Procedures
- Table-specific export procedures
- Data migration scripts
- Schema version control

This schema supports a comprehensive e-government platform with proper security, scalability, and maintainability considerations.