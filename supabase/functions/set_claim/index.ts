
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get SUPABASE_URL and ANON_KEY from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { name, value } = await req.json();
    
    if (!name) {
      throw new Error('Name parameter is required');
    }
    
    // Set the claim value in the current request context
    if (value === null) {
      console.log(`Clearing claim ${name}`);
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: '',
      });
    } else {
      console.log(`Setting claim ${name} to ${value}`);
      // Store the claim in session cookies
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: '',
        // Set the claim as a local session value
        user_metadata: { [name]: value }
      });
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
