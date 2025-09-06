// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

console.log('nano-banana function started')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🌐 [nano-banana] CORS preflight request received');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 [nano-banana] Function invoked - Method:', req.method);
    console.log('🚀 [nano-banana] Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔑 [nano-banana] Environment check - URL exists:', !!supabaseUrl, 'Service key exists:', !!supabaseServiceKey);
    
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? ''
    )

    // Parse request body
    const requestBody = await req.text();
    console.log('📥 [nano-banana] Raw request body:', requestBody);
    
    const { sessionId, prompt } = JSON.parse(requestBody);
    console.log('📋 [nano-banana] Parsed request body:', { sessionId, prompt });
    
    // 1. Retrieve session data
    console.log('🔍 [nano-banana] Retrieving session data for sessionId:', sessionId);
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('roast_sessions')
      .select('original_photo_url')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
      console.error('❌ [nano-banana] Error retrieving session:', sessionError);
      throw new Error(`Session not found: ${sessionError?.message}`);
    }
    
    console.log('✅ [nano-banana] Session data retrieved:', { original_photo_url: sessionData.original_photo_url });
    
    // Update session with user2 prompt
    console.log('🔄 [nano-banana] Updating roast session with user2 prompt:', prompt);
    const { error: updateError } = await supabaseClient
      .from('roast_sessions')
      .update({ user2_prompt: prompt })
      .eq('session_id', sessionId);
    
    if (updateError) {
      console.error('❌ [nano-banana] Error updating session with user2 prompt:', updateError);
    } else {
      console.log('🔄 [nano-banana] Updated roast session with user2 prompt:', prompt);
    }

    // Download original image for multimodal input
    console.log('📸 [nano-banana] Downloading original image:', sessionData.original_photo_url);
    const originalImageResponse = await fetch(sessionData.original_photo_url)
    if (!originalImageResponse.ok) {
      throw new Error(`Failed to download original image: ${originalImageResponse.status}`)
    }
    const originalImageBuffer = await originalImageResponse.arrayBuffer()
    const originalImageBase64 = arrayBufferToBase64(originalImageBuffer)
    console.log('📸 [nano-banana] Original image downloaded and converted to base64');

    // 2. Generate AI image using Gemini 2.5 Flash Image Preview
    console.log('🚀 [nano-banana] Calling Gemini 2.5 Flash Image Preview for image generation...');
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }
    console.log('✅ [nano-banana] Gemini API key found');

    console.log('🚀 [nano-banana] Starting Gemini image generation...');
    
    let geminiResponse;
    try {
      console.log('🔑 [nano-banana] Using Gemini API key:', GEMINI_API_KEY ? 'Found' : 'Missing');
      console.log('📡 [nano-banana] Making request to Gemini API...');
      
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Based on this image, ${prompt}. Generate a completely new AI image that transforms the original concept. Return the generated image.`
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: originalImageBase64
                  }
                }
              ]
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              temperature: 0.9,
              topK: 40,
              topP: 0.95
            }
          })
        })
      
      console.log('📡 [nano-banana] Gemini API response status:', geminiResponse.status);
      console.log('📡 [nano-banana] Gemini API response headers:', Object.fromEntries(geminiResponse.headers.entries()));
      
    } catch (fetchError) {
      console.error('❌ [nano-banana] Gemini API fetch failed:', fetchError);
      console.error('Fetch error details:', JSON.stringify(fetchError, null, 2));
      throw new Error(`Gemini API fetch failed: ${fetchError.message}`)
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ [nano-banana] Gemini API error response:', errorText);
      try {
        const errorJson = JSON.parse(errorText)
        console.error('❌ [nano-banana] Gemini API error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('❌ [nano-banana] Could not parse error response as JSON.');
      }
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`)
    }

    console.log('✅ [nano-banana] Gemini response received');
    
    let finalImageUrl = sessionData.original_photo_url // fallback
    
    // Parse JSON response for image data
    let imageBase64 = null
    let generatedText = ''
    
    try {
      console.log('📖 [nano-banana] Reading JSON response...');
      const responseData = await geminiResponse.json()
      console.log('📋 [nano-banana] Response data keys:', Object.keys(responseData));
      
      // Look for candidates with image data
      const candidates = responseData.candidates || []
      console.log('👥 [nano-banana] Processing', candidates.length, 'candidates');
      
      for (const candidate of candidates) {
        console.log('🔍 [nano-banana] Candidate keys:', Object.keys(candidate));
        const parts = candidate.content?.parts || []
        console.log('📝 [nano-banana] Candidate has', parts.length, 'parts');
        
        for (const part of parts) {
          console.log('🧩 [nano-banana] Part keys:', Object.keys(part));
          
          // Check for image data
          if (part.inline_data?.data) {
            console.log('🖼️ [nano-banana] Found image data! Size:', part.inline_data.data.length);
            imageBase64 = part.inline_data.data
          }
          
          // Check for text content
          if (part.text) {
            console.log('📝 [nano-banana] Found text:', part.text.substring(0, 100) + '...');
            generatedText += part.text
          }
        }
      }
      
      console.log('📊 [nano-banana] Final results:');
      console.log('🖼️ [nano-banana] Image data found:', !!imageBase64);
      console.log('📝 [nano-banana] Generated text length:', generatedText.length);
      
    } catch (parseError) {
      console.error('❌ [nano-banana] Response parsing error:', parseError);
      console.error('Parse error details:', JSON.stringify(parseError, null, 2));
    }

    // 3. If we have generated image data, upload it to Supabase storage
    if (imageBase64) {
      console.log('🎯 [nano-banana] Converting base64 to image buffer...');
      const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
      
      // Upload generated image to Supabase storage
      const fileName = `ai_generated_${sessionId}_${Date.now()}.jpg`
      console.log('📤 [nano-banana] Uploading generated image to storage:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('roast-photos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        })
      
      if (uploadError) {
        console.error('❌ [nano-banana] Error uploading generated image:', uploadError);
        console.log('🔄 [nano-banana] Using original image URL as fallback');
        finalImageUrl = sessionData.original_photo_url
      } else {
        console.log('✅ [nano-banana] Generated image uploaded successfully:', uploadData);
        finalImageUrl = `${supabaseUrl}/storage/v1/object/public/roast-photos/${fileName}`
        console.log('🔗 [nano-banana] Generated image URL:', finalImageUrl);
      }
    } else {
      console.log('⚠️ [nano-banana] No image data found in Gemini response, using original image');
      finalImageUrl = sessionData.original_photo_url
    }

    // 4. Update the roast session with the generated image URL
    console.log('🔄 [nano-banana] Updating roast session with generated image URL:', finalImageUrl);
    const { error: updateImageError } = await supabaseClient
      .from('roast_sessions')
      .update({ generated_photo_url: finalImageUrl })
      .eq('session_id', sessionId)
    
    if (updateImageError) {
      console.error('❌ [nano-banana] Error updating session with generated image URL:', updateImageError);
    } else {
      console.log('✅ [nano-banana] Updated roast session with generated image URL');
    }

    // 5. Insert into inbox for mobile app
    console.log('📬 [nano-banana] Inserting into inbox for mobile app display');
    const { error: inboxError } = await supabaseClient
      .from('inbox')
      .insert({
        session_id: sessionId,
        image_url: finalImageUrl,
        message: generatedText || 'AI image generated successfully!'
      })
    
    if (inboxError) {
      console.error('❌ [nano-banana] Error inserting into inbox:', inboxError);
    } else {
      console.log('✅ [nano-banana] Successfully inserted into inbox');
    }

    console.log('🎉 [nano-banana] AI image generation completed successfully!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: finalImageUrl,
        message: 'AI image generated successfully!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ [nano-banana] Function error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
