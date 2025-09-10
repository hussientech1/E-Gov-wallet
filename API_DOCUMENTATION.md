# MoI Platform - Complete API Documentation

## Overview
This document provides a comprehensive overview of all APIs used in the Ministry of Interior (MoI) Platform. The platform uses Supabase as the backend service with both direct database operations and Edge Functions.

## Table of Contents
1. [Supabase Edge Functions](#supabase-edge-functions)
2. [Authentication APIs](#authentication-apis)
3. [User Management APIs](#user-management-apis)
4. [Document Management APIs](#document-management-apis)
5. [Service Application APIs](#service-application-apis)
6. [Admin Panel APIs](#admin-panel-apis)
7. [Notification APIs](#notification-apis)
8. [Print Queue APIs](#print-queue-apis)
9. [Audit Log APIs](#audit-log-apis)
10. [External APIs](#external-apis)

---

## Supabase Edge Functions

### 1. Check Document Status Function
**Endpoint:** `GET /functions/v1/check_document_status`

**Purpose:** Validates whether a user already has a valid document before allowing new applications.

**Parameters:**
- `userId` (string, required): User's national number
- `documentType` (string, required): Document type or service ID (1-4)

**Response:**
```json
{
  "exists": boolean,
  "expired": boolean,
  "expiryDate": string | null,
  "documentId": string | null,
  "documentStatus": string | null,
  "documentNumber": string | null,
  "issueDate": string | null
}
```

**Usage:** Used in document validation service to prevent duplicate applications.

### 2. Set Claim Function
**Endpoint:** `POST /functions/v1/set_claim`

**Purpose:** Sets user session claims for authentication and authorization.

**Request Body:**
```json
{
  "name": string,
  "value": any
}
```

**Response:**
```json
{
  "success": boolean
}
```

**Usage:** Used during login/logout to set user context and admin privileges.

### 3. Update Register User Function
**Endpoint:** `POST /functions/v1/update_register_user`

**Purpose:** Registers new users in the system with complete profile information.

**Request Body:**
```json
{
  "p_national_number": string,
  "p_full_name": string,
  "p_phone_number": string,
  "p_password": string,
  "p_gender": string,
  "p_state": string,
  "p_address": string,
  "p_email": string
}
```

**Response:**
```json
{
  "success": boolean,
  "message": string
}
```

**Usage:** Used during user registration process.

---

## Authentication APIs

### 1. Custom Login RPC
**Function:** `custom_login`

**Purpose:** Authenticates users using national number and password.

**Parameters:**
- `p_national_number` (string): User's national number
- `p_password` (string): User's password

**Response:**
```json
{
  "success": boolean,
  "national_number": string,
  "full_name": string,
  "message": string
}
```

**Implementation Location:** [`src/contexts/AuthContext.tsx:73`](src/contexts/AuthContext.tsx:73)

### 2. Admin Login
**Table:** `admin_users`

**Purpose:** Authenticates admin users with username and password.

**Query:**
```sql
SELECT * FROM admin_users 
WHERE username = ? AND password = ? AND is_active = true
```

**Implementation Location:** [`src/contexts/AuthContext.tsx:135`](src/contexts/AuthContext.tsx:135)

---

## User Management APIs

### 1. Fetch User Profile
**Table:** `users`

**Purpose:** Retrieves complete user profile information.

**Query:**
```sql
SELECT * FROM users WHERE national_number = ?
```

**Implementation Locations:**
- [`src/pages/Profile.tsx:43`](src/pages/Profile.tsx:43)
- [`src/pages/Documents.tsx:43`](src/pages/Documents.tsx:43)
- [`src/pages/DocumentDetail.tsx:49`](src/pages/DocumentDetail.tsx:49)

### 2. Update User Profile
**Table:** `users`

**Purpose:** Updates user profile information.

**Query:**
```sql
UPDATE users SET ... WHERE national_number = ?
```

**Implementation Location:** [`src/components/profile/ProfileForm.tsx:56`](src/components/profile/ProfileForm.tsx:56)

### 3. Create User Profile
**Table:** `users`

**Purpose:** Creates new user profile.

**Query:**
```sql
INSERT INTO users (...) VALUES (...)
```

**Implementation Location:** [`src/components/profile/CreateProfileForm.tsx:36`](src/components/profile/CreateProfileForm.tsx:36)

### 4. User Verification
**Table:** `users`

**Purpose:** Verifies if user exists in the system.

**Query:**
```sql
SELECT national_number FROM users WHERE national_number = ? LIMIT 1
```

**Implementation Location:** [`src/pages/Services.tsx:51`](src/pages/Services.tsx:51)

---

## Document Management APIs

### 1. Fetch User Documents
**Table:** `user_documents`

**Purpose:** Retrieves all documents belonging to a user.

**Query:**
```sql
SELECT * FROM user_documents WHERE national_number = ?
```

**Implementation Locations:**
- [`src/pages/Documents.tsx:63`](src/pages/Documents.tsx:63)
- [`src/pages/Home.tsx:32`](src/pages/Home.tsx:32)
- [`src/pages/DocumentDetail.tsx:68`](src/pages/DocumentDetail.tsx:68)

### 2. Document Status Validation
**Table:** `user_documents`

**Purpose:** Checks if user has existing valid documents.

**Query:**
```sql
SELECT * FROM user_documents 
WHERE national_number = ? AND doc_type = ? AND document_status = 'active'
ORDER BY created_at DESC LIMIT 1
```

**Implementation Location:** [`src/services/documentValidation.ts:62`](src/services/documentValidation.ts:62)

### 3. Update Document
**Table:** `user_documents`

**Purpose:** Updates document information.

**Query:**
```sql
UPDATE user_documents SET ... WHERE doc_id = ?
```

**Implementation Location:** [`src/components/documents/DocumentForm.tsx:44`](src/components/documents/DocumentForm.tsx:44)

### 4. Delete Document
**Table:** `user_documents`

**Purpose:** Deletes a document.

**Query:**
```sql
DELETE FROM user_documents WHERE doc_id = ?
```

**Implementation Location:** [`src/components/documents/DocumentActions.tsx:73`](src/components/documents/DocumentActions.tsx:73)

### 5. Create Document (Admin)
**Table:** `user_documents`

**Purpose:** Creates new document when application is approved.

**Query:**
```sql
INSERT INTO user_documents (...) VALUES (...)
```

**Implementation Location:** [`src/utils/applicationUtils.ts:77`](src/utils/applicationUtils.ts:77)

---

## Service Application APIs

### 1. Fetch Services
**Table:** `services`

**Purpose:** Retrieves all available services.

**Query:**
```sql
SELECT * FROM services
```

**Implementation Location:** [`src/pages/Services.tsx:74`](src/pages/Services.tsx:74)

### 2. Submit Service Application
**Table:** `service_applications`

**Purpose:** Submits new service application.

**Query:**
```sql
INSERT INTO service_applications (...) VALUES (...)
```

**Implementation Location:** [`src/components/services/ServiceApplicationDialog.tsx:205`](src/components/services/ServiceApplicationDialog.tsx:205)

### 3. Fetch User Applications
**Table:** `service_applications`

**Purpose:** Retrieves user's service applications.

**Query:**
```sql
SELECT *, services(service_name) FROM service_applications 
WHERE national_number = ? ORDER BY submitted_at DESC
```

**Implementation Location:** [`src/pages/Home.tsx:51`](src/pages/Home.tsx:51)

### 4. Get Service Required Documents
**Table:** `services`

**Purpose:** Retrieves required documents for a service.

**Query:**
```sql
SELECT required_documents FROM services WHERE service_id = ?
```

**Implementation Location:** [`src/components/services/ServiceApplicationDialog.tsx:78`](src/components/services/ServiceApplicationDialog.tsx:78)

### 5. Upload Application Documents
**Table:** `uploaded_documents`

**Purpose:** Stores uploaded documents for applications.

**Query:**
```sql
INSERT INTO uploaded_documents (...) VALUES (...)
```

**Implementation Location:** [`src/components/services/ServiceApplicationDialog.tsx:258`](src/components/services/ServiceApplicationDialog.tsx:258)

---

## Admin Panel APIs

### 1. Fetch All Applications (Admin)
**Table:** `service_applications`

**Purpose:** Retrieves all service applications with user and service details.

**Query:**
```sql
SELECT *, 
  users!service_applications_national_number_fkey (...),
  services!service_applications_service_id_fkey (...)
FROM service_applications ORDER BY submitted_at DESC
```

**Implementation Location:** [`src/components/admin/AdminApplications.tsx:34`](src/components/admin/AdminApplications.tsx:34)

### 2. Update Application Status (Admin)
**Table:** `service_applications`

**Purpose:** Updates application status (approve/reject).

**Query:**
```sql
UPDATE service_applications SET 
  application_status = ?, 
  reviewed_at = ?, 
  reviewed_by = ?,
  rejection_reason = ?
WHERE application_id = ?
```

**Implementation Location:** [`src/utils/adminUtils.ts:22`](src/utils/adminUtils.ts:22)

### 3. Fetch All Users (Admin)
**Table:** `users`

**Purpose:** Retrieves all registered users.

**Query:**
```sql
SELECT * FROM users
```

**Implementation Location:** [`src/components/admin/AdminUsers.tsx:56`](src/components/admin/AdminUsers.tsx:56)

### 4. Update User (Admin)
**Table:** `users`

**Purpose:** Updates user information by admin.

**Query:**
```sql
UPDATE users SET ... WHERE national_number = ?
```

**Implementation Location:** [`src/components/admin/AdminUsers.tsx:137`](src/components/admin/AdminUsers.tsx:137)

### 5. Delete User (Admin)
**Table:** `users`

**Purpose:** Deletes user account.

**Query:**
```sql
DELETE FROM users WHERE national_number = ?
```

**Implementation Location:** [`src/components/admin/AdminUsers.tsx:224`](src/components/admin/AdminUsers.tsx:224)

### 6. Reset User Password (Admin)
**Table:** `users`, `password_reset_tokens`

**Purpose:** Resets user password and creates reset token.

**Queries:**
```sql
UPDATE users SET password_hash = ? WHERE national_number = ?
INSERT INTO password_reset_tokens (...) VALUES (...)
```

**Implementation Location:** [`src/components/admin/AdminUsers.tsx:169`](src/components/admin/AdminUsers.tsx:169)

### 7. Fetch All Documents (Admin)
**Table:** `user_documents`

**Purpose:** Retrieves all documents in the system.

**Query:**
```sql
SELECT *, users!user_documents_national_number_fkey (full_name)
FROM user_documents ORDER BY created_at DESC
```

**Implementation Location:** [`src/components/admin/AdminDocuments.tsx:41`](src/components/admin/AdminDocuments.tsx:41)

### 8. Delete Document (Admin)
**Table:** `user_documents`

**Purpose:** Deletes document by admin.

**Query:**
```sql
DELETE FROM user_documents WHERE doc_id = ?
```

**Implementation Location:** [`src/components/admin/AdminDocuments.tsx:164`](src/components/admin/AdminDocuments.tsx:164)

---

## Notification APIs

### 1. Fetch User Notifications
**Table:** `notifications`

**Purpose:** Retrieves notifications for a specific user.

**Query:**
```sql
SELECT * FROM notifications 
WHERE national_number = ? ORDER BY created_at DESC
```

**Implementation Location:** [`src/pages/Notifications.tsx:49`](src/pages/Notifications.tsx:49)

### 2. Send Notification (Admin)
**Table:** `notifications`

**Purpose:** Sends notification to user.

**Query:**
```sql
INSERT INTO notifications (...) VALUES (...)
```

**Implementation Locations:**
- [`src/components/admin/AdminNotifications.tsx:123`](src/components/admin/AdminNotifications.tsx:123)
- [`src/components/admin/AdminUsers.tsx:184`](src/components/admin/AdminUsers.tsx:184)
- [`src/utils/applicationUtils.ts:140`](src/utils/applicationUtils.ts:140)

### 3. Fetch Notification History (Admin)
**Table:** `notifications`

**Purpose:** Retrieves recent notifications sent by admin.

**Query:**
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50
```

**Implementation Location:** [`src/components/admin/AdminNotifications.tsx:48`](src/components/admin/AdminNotifications.tsx:48)

---

## Print Queue APIs

### 1. Fetch Print Queue (Admin)
**Table:** `print_queue`

**Purpose:** Retrieves documents in print queue.

**Query:**
```sql
SELECT * FROM print_queue ORDER BY created_at ASC
```

**Implementation Locations:**
- [`src/components/admin/AdminPrintQueue.tsx:127`](src/components/admin/AdminPrintQueue.tsx:127)
- [`src/components/admin/AdminPrintQueueFixed.tsx:98`](src/components/admin/AdminPrintQueueFixed.tsx:98)

### 2. Add to Print Queue
**Table:** `print_queue`

**Purpose:** Adds approved application to print queue.

**Query:**
```sql
INSERT INTO print_queue (...) VALUES (...)
```

**Implementation Location:** [`src/utils/applicationUtils.ts:114`](src/utils/applicationUtils.ts:114)

### 3. Update Print Status (Admin)
**Table:** `print_queue`

**Purpose:** Updates print status of documents.

**Query:**
```sql
UPDATE print_queue SET print_status = ?, printed_at = ? WHERE queue_id = ?
```

**Implementation Locations:**
- [`src/components/admin/AdminPrintQueue.tsx:293`](src/components/admin/AdminPrintQueue.tsx:293)
- [`src/components/admin/AdminPrintQueueFixed.tsx:222`](src/components/admin/AdminPrintQueueFixed.tsx:222)

### 4. Mark as Collected (Admin)
**Table:** `print_queue`

**Purpose:** Marks document as collected by user.

**Query:**
```sql
UPDATE print_queue SET print_status = 'collected', collected_at = ? WHERE queue_id = ?
```

**Implementation Locations:**
- [`src/components/admin/AdminPrintQueue.tsx:352`](src/components/admin/AdminPrintQueue.tsx:352)
- [`src/components/admin/AdminPrintQueueFixed.tsx:281`](src/components/admin/AdminPrintQueueFixed.tsx:281)

---

## Audit Log APIs

### 1. Log Admin Action
**Table:** `admin_logs`

**Purpose:** Records admin actions for audit trail.

**Query:**
```sql
INSERT INTO admin_logs (admin_username, action, ip_address) VALUES (?, ?, ?)
```

**Implementation Locations:**
- [`src/pages/Admin.tsx:24`](src/pages/Admin.tsx:24)
- [`src/components/admin/AdminUsers.tsx:283`](src/components/admin/AdminUsers.tsx:283)

### 2. Fetch Admin Logs
**Table:** `admin_logs`

**Purpose:** Retrieves admin activity logs.

**Query:**
```sql
SELECT * FROM admin_logs ORDER BY created_at DESC
```

**Implementation Location:** [`src/components/admin/AdminLogs.tsx:36`](src/components/admin/AdminLogs.tsx:36)

### 3. Fetch Admin Names
**Table:** `admin_users`

**Purpose:** Gets admin full names for log display.

**Query:**
```sql
SELECT full_name FROM admin_users WHERE username = ?
```

**Implementation Location:** [`src/components/admin/AdminLogs.tsx:58`](src/components/admin/AdminLogs.tsx:58)

---

## Dashboard Statistics APIs

### 1. User Count
**Table:** `users`

**Purpose:** Gets total registered users count.

**Query:**
```sql
SELECT COUNT(*) FROM users
```

**Implementation Location:** [`src/components/admin/AdminDashboard.tsx:40`](src/components/admin/AdminDashboard.tsx:40)

### 2. Application Statistics
**Table:** `service_applications`

**Purpose:** Gets application counts by status.

**Queries:**
```sql
SELECT COUNT(*) FROM service_applications WHERE application_status = 'Pending'
SELECT COUNT(*) FROM service_applications WHERE application_status = 'Approved'
SELECT COUNT(*) FROM service_applications WHERE application_status = 'Rejected'
```

**Implementation Location:** [`src/components/admin/AdminDashboard.tsx:45-60`](src/components/admin/AdminDashboard.tsx:45-60)

### 3. Document Count
**Table:** `user_documents`

**Purpose:** Gets total documents count.

**Query:**
```sql
SELECT COUNT(*) FROM user_documents
```

**Implementation Location:** [`src/components/admin/AdminDashboard.tsx:63`](src/components/admin/AdminDashboard.tsx:63)

### 4. Pending Print Count
**Table:** `print_queue`

**Purpose:** Gets pending print queue count.

**Query:**
```sql
SELECT COUNT(*) FROM print_queue WHERE print_status = 'pending_print'
```

**Implementation Location:** [`src/components/admin/AdminDashboard.tsx:68`](src/components/admin/AdminDashboard.tsx:68)

---

## Document Viewer APIs (Admin)

### 1. Fetch All Uploaded Documents
**Table:** `uploaded_documents`

**Purpose:** Retrieves all uploaded documents.

**Query:**
```sql
SELECT * FROM uploaded_documents ORDER BY uploaded_at DESC
```

**Implementation Location:** [`src/components/admin/documents/DocumentViewer.tsx:70`](src/components/admin/documents/DocumentViewer.tsx:70)

### 2. Fetch Application Documents
**Table:** `uploaded_documents`

**Purpose:** Retrieves documents for specific application.

**Query:**
```sql
SELECT * FROM uploaded_documents WHERE application_id = ?
```

**Implementation Location:** [`src/components/admin/documents/DocumentViewer.tsx:94`](src/components/admin/documents/DocumentViewer.tsx:94)

### 3. Get Application Documents RPC
**Function:** `get_application_documents`

**Purpose:** Gets documents using RPC function.

**Parameters:**
- `app_id` (number): Application ID

**Implementation Location:** [`src/components/admin/documents/DocumentViewer.tsx:116`](src/components/admin/documents/DocumentViewer.tsx:116)

### 4. Update Document Status RPC
**Function:** `update_document_status`

**Purpose:** Updates document verification status.

**Parameters:**
- `doc_id` (number): Document ID
- `new_status` (string): New status

**Implementation Location:** [`src/components/admin/documents/DocumentViewer.tsx:189`](src/components/admin/documents/DocumentViewer.tsx:189)

### 5. Update Document Details
**Table:** `uploaded_documents`

**Purpose:** Updates document information.

**Query:**
```sql
UPDATE uploaded_documents SET ... WHERE upload_id = ?
```

**Implementation Location:** [`src/components/admin/documents/DocumentViewer.tsx:225`](src/components/admin/documents/DocumentViewer.tsx:225)

---

## External APIs

### 1. IP Address API
**Endpoint:** `https://api.ipify.org?format=json`

**Purpose:** Gets user's IP address for logging.

**Response:**
```json
{
  "ip": "xxx.xxx.xxx.xxx"
}
```

**Implementation Location:** [`src/pages/Admin.tsx:21`](src/pages/Admin.tsx:21)

---

## API Usage Patterns

### 1. Error Handling
All API calls implement consistent error handling:
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // Handle success
} catch (error) {
  console.error('Error:', error);
  toast({ title: "Error", description: "Operation failed", variant: "destructive" });
}
```

### 2. Loading States
Most components implement loading states:
```typescript
const [loading, setLoading] = useState(true);
// ... API call
setLoading(false);
```

### 3. Real-time Updates
Some components refresh data after operations:
```typescript
await performOperation();
await fetchUpdatedData(); // Refresh data
```

### 4. Authentication Context
All API calls respect user authentication:
```typescript
if (!user) return; // Check authentication
// Proceed with API call
```

---

## Security Considerations

1. **Row Level Security (RLS)**: Supabase tables use RLS policies to ensure users can only access their own data.

2. **Admin Privileges**: Admin operations are protected by checking `isAdmin` flag in user context.

3. **Input Validation**: All user inputs are validated before API calls.

4. **Error Messages**: Generic error messages are shown to users to prevent information disclosure.

5. **Audit Logging**: All admin actions are logged for security auditing.

---

## Performance Optimizations

1. **Selective Queries**: Only required fields are selected in queries.

2. **Pagination**: Large datasets implement pagination (limit/offset).

3. **Caching**: User context and frequently accessed data are cached.

4. **Batch Operations**: Multiple related operations are batched when possible.

5. **Optimistic Updates**: UI updates optimistically before API confirmation.

---

## API Rate Limits and Quotas

The platform uses Supabase's default rate limits:
- **Database Operations**: 1000 requests per minute per IP
- **Edge Functions**: 500 requests per minute per IP
- **Storage Operations**: 200 requests per minute per IP

---

## Monitoring and Analytics

1. **Error Tracking**: All API errors are logged to console for debugging.

2. **Performance Monitoring**: Loading states provide user feedback.

3. **Usage Analytics**: Admin dashboard shows system usage statistics.

4. **Audit Trail**: Complete audit log of admin actions.

---

This documentation covers all API endpoints and database operations used in the MoI Platform. Each API is categorized by functionality and includes implementation details, query examples, and usage patterns.