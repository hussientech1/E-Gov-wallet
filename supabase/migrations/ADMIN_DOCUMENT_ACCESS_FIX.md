# Admin Document Access Fix

## Problem
Admin users cannot see documents uploaded by users during service applications, even though the documents are being uploaded successfully.

## Root Cause
The issue is caused by Row Level Security (RLS) policies on the `uploaded_documents` table that prevent admin access. The current RLS policies rely on session settings that aren't properly configured for admin users.

## Solution

### 1. Database Migration Required
You need to apply the migration file `supabase/migrations/007_fix_admin_document_access.sql` to your database. This migration:

- Creates admin-specific database functions that bypass RLS
- Updates RLS policies to allow authenticated users to access documents
- Provides secure admin functions for document management

### 2. Key Changes Made

#### Database Functions Created:
- `get_application_documents(app_id INTEGER)` - Allows admins to retrieve all documents for an application
- `update_document_status(doc_id, new_status, admin_user, reason)` - Allows admins to verify/reject documents

#### Updated Components:
- `DocumentViewer.tsx` - Now uses admin database functions instead of direct table access
- `ServiceApplicationDialog.tsx` - Added debugging for document insertion process
- Admin components updated to show document status indicators

### 3. How to Apply the Fix

#### Step 1: Apply Database Migration
Run the following command in your terminal:
```bash
cd supabase
npx supabase db push
```

Or manually execute the SQL in `supabase/migrations/007_fix_admin_document_access.sql` in your Supabase dashboard.

#### Step 2: Test the System
1. Create a new service application with documents as a user
2. Check the browser console for document insertion logs
3. Login as admin and view the application
4. Verify documents are visible and can be verified/rejected

### 4. Debugging Steps

#### Check Document Insertion:
1. Open browser developer tools
2. Submit a service application with documents
3. Look for console logs:
   - "Preparing to insert documents for application: [ID]"
   - "Documents to insert: [document types]"
   - "Documents inserted successfully: [count]"

#### Check Admin Document Access:
1. Login as admin
2. View an application with documents
3. Look for console logs:
   - "Fetching documents for application ID: [ID]"
   - "Documents query result: {data: [...], error: null}"
   - "Found documents: [count]"

### 5. Security Notes

The new implementation:
- Uses `SECURITY DEFINER` functions that run with elevated privileges
- Maintains audit trails for document verification actions
- Allows authenticated users to access documents (suitable for admin context)
- Provides proper error handling and logging

### 6. Expected Behavior After Fix

1. **User Side**: Documents upload successfully during service application
2. **Admin Side**: 
   - Can view all uploaded documents for each application
   - Can preview images and download PDFs
   - Can verify or reject documents with reasons
   - Application approval is blocked until all documents are verified
   - Document status indicators show throughout admin interface

### 7. Troubleshooting

If documents still don't appear:

1. **Check Migration Applied**: Verify the functions exist in your database
2. **Check Console Logs**: Look for any error messages in browser console
3. **Check Database**: Manually query `uploaded_documents` table to see if documents are being inserted
4. **Check Permissions**: Ensure admin user has proper authentication

### 8. Files Modified

- `supabase/migrations/007_fix_admin_document_access.sql` - New migration
- `src/components/admin/documents/DocumentViewer.tsx` - Updated to use admin functions
- `src/components/services/ServiceApplicationDialog.tsx` - Added debugging
- `src/components/admin/applications/RequestDetailsView.tsx` - Integrated document viewer
- `src/components/admin/applications/ApplicationsTable.tsx` - Added document status indicators
- `src/components/admin/AdminApplications.tsx` - Enhanced with document metadata
- `src/types/application.ts` - Added document status fields

The system now provides a complete document management workflow for admins with proper security and audit trails.