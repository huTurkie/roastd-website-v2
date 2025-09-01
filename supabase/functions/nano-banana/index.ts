// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key to bypass RLS for testing
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, prompt } = await req.json()

    if (!sessionId || !prompt) {
      throw new Error('Session ID and prompt are required.')
    }

    console.log('Received request:', { sessionId, prompt })

    // 1. Get session details
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('roast_sessions')
      .select('original_photo_url')
      .eq('session_id', sessionId)
      .single()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }

    console.log('Session data:', sessionData)

    // 2. ** GOOGLE NANO BANANA MODEL INTEGRATION **
    // TODO: Integrate actual AI image generation service
    
    // 3. Save the roast submission
    const { data: submissionData, error: submissionError } = await supabaseClient
      .from('roast_submissions')
      .insert({
        session_id: sessionId,
        roast_text: prompt
      })
      .select('submission_id')
      .single()

    if (submissionError) {
      console.error('Submission error:', submissionError)
      throw submissionError
    }

    console.log('Submission saved:', submissionData)

    return new Response(JSON.stringify({ 
      success: true, 
      submission_id: submissionData.submission_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in nano-banana function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/nano-banana' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
