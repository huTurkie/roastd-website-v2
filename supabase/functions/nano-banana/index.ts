// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('nano-banana function started')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing request...')
    
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { sessionId, prompt } = await req.json()
    console.log('Request data:', { sessionId, prompt })

    if (!sessionId || !prompt) {
      throw new Error('Session ID and prompt are required.')
    }

    // 1. Get session details
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('roast_sessions')
      .select('original_photo_url, link_code')
      .eq('session_id', sessionId)
      .single()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }

    console.log('Session data retrieved:', sessionData)

    // Update the roast session with user2's prompt
    const { error: updateError } = await supabaseClient
      .from('roast_sessions')
      .update({ updated_prompt: prompt })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error('Error updating session with user2 prompt:', updateError)
      // Don't throw error, just log it
    } else {
      console.log('Updated roast session with user2 prompt:', prompt)
    }

    // --- TEMPORARY DEBUGGING: Return user's original photo instead of generating new image ---
    console.log('--- SKIPPING GEMINI API: Using user original photo ---')
    const generatedImageUrl = sessionData.original_photo_url
    console.log('Using original photo URL:', generatedImageUrl)
    // --- END TEMPORARY DEBUGGING ---

    // 3. Insert the roast submission with original image URL
    const { data: submissionData, error: submissionError } = await supabaseClient
      .from('roast_submissions')
      .insert({
        session_id: sessionId,
        roast_text: prompt,
        ai_generated_image_url: generatedImageUrl
      })
      .select('submission_id')
      .single()

    if (submissionError) {
      console.error('Submission error:', submissionError)
      throw submissionError
    }

    console.log('Roast submission created:', submissionData)

    // 4. Create an inbox entry (using link_code as identifier)
    console.log('--- DEBUGGING INBOX INSERTION ---')
    console.log('Session link_code:', sessionData.link_code)
    console.log('Attempting to insert inbox entry with data:', {
      user_id: sessionData.link_code,
      prompt: prompt,
      original_photo_url: sessionData.original_photo_url,
      generated_photo_url: generatedImageUrl,
      roast: prompt
    })
    
    const { data: inboxData, error: inboxError } = await supabaseClient
      .from('inbox')
      .insert({
        user_id: sessionData.link_code,
        prompt: prompt,
        original_photo_url: sessionData.original_photo_url,
        generated_photo_url: generatedImageUrl,
        roast: prompt
      })
      .select('id')
      .single()

    console.log('Inbox insertion result - Data:', inboxData)
    console.log('Inbox insertion result - Error:', inboxError)
    
    if (inboxError) {
      console.error('Failed to create inbox entry:', inboxError)
      console.error('Inbox error details:', JSON.stringify(inboxError, null, 2))
      // Don't throw error, just log it - we still want to return the roast
    } else {
      console.log('Inbox entry created successfully:', inboxData)
    }
    console.log('--- END INBOX DEBUGGING ---')

    return new Response(JSON.stringify({ 
      success: true, 
      submission_id: submissionData.submission_id,
      message_id: inboxData?.id || null,
      ai_image_url: generatedImageUrl,
      original_roast: prompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Function error:', error)
    console.error('Stack trace:', error.stack)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
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
