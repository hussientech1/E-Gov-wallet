
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { 
      p_national_number, 
      p_full_name, 
      p_phone_number, 
      p_password,
      p_gender,
      p_state,
      p_address,
      p_email
    } = await req.json();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('national_number')
      .eq('national_number', p_national_number)
      .limit(1);

    if (checkError) {
      return new Response(
        JSON.stringify({ success: false, message: checkError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (existingUser && existingUser.length > 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'User already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Insert new user with additional fields
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        national_number: p_national_number,
        full_name: p_full_name,
        phone_number: p_phone_number,
        password_hash: p_password, // In a real app, properly hash this
        gender: p_gender,
        state: p_state,
        address: p_address,
        email: p_email,
        profile_completed: true, // Since we're collecting all info now
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, message: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User registered successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
