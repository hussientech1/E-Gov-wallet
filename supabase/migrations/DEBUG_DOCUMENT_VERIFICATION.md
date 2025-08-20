# Debug Document Verification Issue

## Problem
Document verification (approve/reject) buttons are not working properly in the admin panel.

## Enhanced Debugging Added

I've added extensive debugging to the document verification process. Here's how to test and identify the issue:

## Step-by-Step Testing

### Step 1: Test Document Verification

1. **Open Browser Developer Tools**
   - Press F12 → Console tab
   - Clear existing logs

2. **Try to Verify a Document**
   - Go to admin panel
   - View an application with pending documents
   - Click the "Verify" button on a document

3. **Check Console Logs**
   Look for these detailed logs:

   **Expected Success Logs:**
   ```
   === DOCUMENT VERIFICATION DEBUG START ===
   Document ID: [number]
   Action: verify
   User: {nationalNumber: "..."}
   Admin National Number: [admin_id]
   Target status: verified
   Attempting to use admin RPC function for document update...
   RPC function not available or failed: [error]
   Trying direct table update...
   Update data: {upload_status: "verified", verified_at: "...", verified_by: "..."}
   Direct update result: {updateResult: [...], updateErr: null}
   Direct table update succeeded
   Updated rows: 1
   Update success: true
   Showing success toast and refreshing documents
   Calling fetchDocuments to refresh...
   Calling onDocumentStatusChange callback...
   Document verification completed successfully
   === DOCUMENT VERIFICATION DEBUG END ===
   ```

   **If You See Errors:**
   - Note the exact error message
   - Note if it's an RPC error or direct table update error
   - Check if "Updated rows: 0" (means no rows were updated)

### Step 2: Test Document Rejection

1. **Try to Reject a Document**
   - Click "Reject" button
   - Enter a rejection reason
   - Click "Reject Document"

2. **Check Console Logs**
   Similar to verification, but with:
   ```
   Action: reject
   Reason: [your rejection reason]
   Target status: rejected
   Update data: {upload_status: "rejected", verified_at: "...", verified_by: "...", rejection_reason: "..."}
   ```

## Common Issues and Solutions

### Issue 1: "Admin user information is missing"
**Cause**: Admin user context not properly loaded
**Solution**: Check if admin login is working properly

### Issue 2: "Updated rows: 0"
**Cause**: Document with that upload_id doesn't exist or no permission to update
**Solutions**:
- Check if the document exists: `SELECT * FROM uploaded_documents WHERE upload_id = [ID];`
- Check UPDATE permissions: `GRANT UPDATE ON uploaded_documents TO authenticated;`

### Issue 3: RLS Policy Blocking Updates
**Cause**: Row Level Security preventing updates
**Solution**: Run this SQL to allow updates:
```sql
-- Allow authenticated users to update documents
CREATE POLICY "Authenticated users can update documents" ON public.uploaded_documents
    FOR UPDATE USING (auth.role() = 'authenticated');
```

### Issue 4: Column Doesn't Exist
**Cause**: Database schema mismatch
**Solution**: Check if all columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'uploaded_documents';
```

Required columns:
- `upload_id` (integer, primary key)
- `upload_status` (varchar)
- `verified_at` (timestamp)
- `verified_by` (varchar)
- `rejection_reason` (text)

## Quick Fixes to Try

### Fix 1: Ensure UPDATE Permission
```sql
GRANT UPDATE ON public.uploaded_documents TO authenticated;
```

### Fix 2: Add Missing RLS Policy for Updates
```sql
CREATE POLICY "Allow document updates" ON public.uploaded_documents
    FOR UPDATE USING (true);
```

### Fix 3: Check Table Structure
```sql
-- Add missing columns if they don't exist
ALTER TABLE public.uploaded_documents 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

## What to Share

If verification still doesn't work, please share:

1. **Console logs** from the verification attempt (the entire debug block)
2. **Database query results**:
   ```sql
   SELECT * FROM uploaded_documents WHERE upload_id = [the_document_id_you_tried_to_verify];
   ```
3. **Table structure**:
   ```sql
   \d uploaded_documents
   ```
   or
   ```sql
   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'uploaded_documents';
   ```

## Expected Behavior After Fix

1. **Verify Button**: Changes document status to "verified", shows green badge
2. **Reject Button**: Opens dialog, accepts reason, changes status to "rejected"
3. **Status Updates**: Document badges update immediately
4. **Application Status**: Application approval becomes available when all documents verified
5. **Audit Trail**: Shows who verified/rejected and when

The enhanced debugging will show exactly where the process is failing and guide us to the specific fix needed.