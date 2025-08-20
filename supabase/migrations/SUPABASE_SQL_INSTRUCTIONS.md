# How to Run the Document Verification Fix

## Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your MoI Platform project

## Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New query"** to create a new SQL script

## Step 3: Run the Fix
1. Open the file `MANUAL_FIX_DOCUMENT_VERIFICATION.sql` in VS Code
2. Copy ALL the SQL content from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)

## Step 4: Verify Success
You should see messages like:
- `CREATE FUNCTION` - Function created successfully
- `GRANT` - Permissions granted
- `ALTER TABLE` - Columns added (if they didn't exist)
- `CREATE POLICY` - Security policy created

## Step 5: Test Document Verification
1. Go back to your admin panel in the browser
2. Try to verify or reject a document
3. The verification should now work properly!

## What This Fix Does
- ✅ Creates the missing `update_document_status` RPC function
- ✅ Ensures all required database columns exist
- ✅ Sets proper permissions for authenticated users
- ✅ Creates security policies for document updates
- ✅ Provides detailed error handling and success responses

## If You Get Errors
If you see any errors when running the SQL:
1. Copy the exact error message
2. Let me know what went wrong
3. I can provide a targeted fix for the specific issue

The document verification should work perfectly after running this SQL script!