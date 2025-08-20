# Debug Admin Document Access - Step by Step

## Current Status
The admin panel shows "Failed to load documents" error. I've added extensive debugging to help identify the exact issue.

## Step-by-Step Debugging Process

### Step 1: Test Document Upload (User Side)

1. **Open Browser Developer Tools**
   - Press F12 or right-click → Inspect
   - Go to **Console** tab
   - Clear any existing logs

2. **Submit a Service Application with Documents**
   - Go to Services page as a regular user
   - Select a service that requires documents
   - Upload the required documents
   - Submit the application

3. **Check Console Logs**
   Look for these specific log messages:

   **Expected Success Logs:**
   ```
   === DOCUMENT INSERTION DEBUG START ===
   Application ID: [number]
   Documents object: {...}
   Documents count: [number > 0]
   Preparing to insert documents for application: [ID]
   Document inserts prepared: [number]
   Attempting to insert documents...
   Documents inserted successfully: [number]
   === DOCUMENT INSERTION DEBUG END ===
   ```

   **If You See Error Logs:**
   - Note the exact error message
   - Note the error code (if any)
   - Take a screenshot of the console

### Step 2: Test Admin Document Access

1. **Login as Admin**
   - Go to admin panel
   - Navigate to Applications section

2. **Open Browser Developer Tools**
   - Press F12 → Console tab
   - Clear existing logs

3. **View an Application**
   - Click to expand/view an application that should have documents
   - Look for the document section

4. **Check Console Logs**
   Look for these specific log messages:

   **Expected Success Logs:**
   ```
   === DOCUMENT FETCH DEBUG START ===
   Application ID: [number]
   Checking uploaded_documents table...
   All documents query result: {data: [...], error: null}
   Table exists, found [number] total documents
   Fetching documents for application: [ID]
   Found [number] documents for application [ID]
   === DOCUMENT FETCH DEBUG END ===
   ```

   **If You See Error Logs:**
   - Note the exact error message
   - Note if it says "table does not exist" or "no permission"
   - Take a screenshot

### Step 3: Database Check

1. **Go to Supabase Dashboard**
   - Open your Supabase project
   - Go to **SQL Editor**

2. **Check if Table Exists**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'uploaded_documents';
   ```

3. **Check Table Contents**
   ```sql
   SELECT * FROM uploaded_documents LIMIT 10;
   ```

4. **Check RLS Status**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'uploaded_documents';
   ```

### Step 4: Apply Quick Fix

Based on what you find, apply the appropriate fix:

#### If Table Doesn't Exist:
Run the migration:
```sql
-- From supabase/migrations/003_create_document_upload_tables.sql
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
    verified_by VARCHAR(50)
);
```

#### If RLS is Blocking Access:
```sql
ALTER TABLE public.uploaded_documents DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.uploaded_documents TO authenticated;
```

#### If Documents Aren't Being Inserted:
Check the console logs from Step 1 for the exact error during insertion.

### Step 5: Test Again

After applying any fixes:
1. Submit a new service application with documents
2. Check console logs for successful insertion
3. Login as admin and try to view documents
4. Check console logs for successful retrieval

## Common Issues and Solutions

### Issue 1: "Table does not exist"
**Solution**: Run the table creation migration from Step 4

### Issue 2: "No permission to access table"
**Solution**: Run the RLS disable command from Step 4

### Issue 3: "Documents not being inserted"
**Possible Causes**:
- User doesn't have INSERT permission
- Required documents validation failing
- File size too large
- Base64 encoding issues

### Issue 4: "RPC function does not exist"
**Solution**: This is expected - the fallback code should handle this

## What to Share

If you're still having issues, please share:

1. **Console logs** from both user document upload and admin document access
2. **Database query results** from Step 3
3. **Exact error messages** you're seeing
4. **Screenshots** of the console errors

This will help identify the exact root cause and provide a targeted solution.