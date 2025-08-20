import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for database access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse request parameters
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const documentType = url.searchParams.get('documentType')

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!documentType) {
      return new Response(
        JSON.stringify({ error: 'Missing documentType parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Map service ID to document type if needed
    let docType = documentType
    const serviceIdToDocType: Record<string, string> = {
      '1': 'passport',
      '2': 'national_id',
      '3': 'birth_certificate',
      '4': 'driver_license'
    }

    // If documentType is a service ID (1-4), convert to document type
    if (serviceIdToDocType[documentType]) {
      docType = serviceIdToDocType[documentType]
    }

    // Validate document type
    const validDocTypes = ['passport', 'national_id', 'birth_certificate', 'driver_license']
    if (!validDocTypes.includes(docType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid document type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Checking document status for user: ${userId}, document type: ${docType}`)

    // Query user_documents table for the specific document
    const { data: documents, error } = await supabaseClient
      .from('user_documents')
      .select('*')
      .eq('national_number', userId)
      .eq('doc_type', docType)
      .eq('document_status', 'active') // Only check active documents
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database query failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare response
    let response = {
      exists: false,
      expired: false,
      expiryDate: null,
      documentId: null,
      documentStatus: null,
      documentNumber: null,
      issueDate: null
    }

    if (documents && documents.length > 0) {
      const document = documents[0]
      const currentDate = new Date()
      const expiryDate = document.expiry_date ? new Date(document.expiry_date) : null
      
      // Check if document is expired
      const isExpired = expiryDate ? expiryDate < currentDate : false

      response = {
        exists: true,
        expired: isExpired,
        expiryDate: document.expiry_date,
        documentId: document.doc_id.toString(),
        documentStatus: document.document_status,
        documentNumber: document.doc_number,
        issueDate: document.issue_date
      }

      console.log(`Document found: ID ${document.doc_id}, Status: ${document.document_status}, Expired: ${isExpired}`)
    } else {
      console.log('No active document found')
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})