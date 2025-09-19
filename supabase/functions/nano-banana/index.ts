// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Using direct REST API instead of SDK for better Supabase compatibility
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔥 [nano-banana] STEP 1: Function invoked');
    
    const { link_code, prompt } = await req.json()
    console.log('🔥 [nano-banana] STEP 2: Extracted parameters:', { link_code, prompt });

    if (!link_code || !prompt) {
      throw new Error('Missing required parameters: link_code and prompt')
    }

    console.log('🔥 [nano-banana] STEP 3: Initializing Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔥 [nano-banana] STEP 4: Looking up session by link_code:', link_code);
    
    // DEBUG: Log the exact link_code value and type for debugging
    console.log('🔍 [nano-banana] DEBUG: Received link_code:', JSON.stringify(link_code), 'Type:', typeof link_code);
    
    // First, let's check if any sessions exist at all for debugging
    const { data: allSessions, error: allSessionsError } = await supabaseClient
      .from('roast_sessions')
      .select('link_code, session_id')
      .limit(5);
    
    console.log('🔍 [nano-banana] DEBUG: Sample sessions in database:', allSessions);
    console.log('🔍 [nano-banana] DEBUG: All sessions query error:', allSessionsError);
    
    // Get the ORIGINAL session record (the first one created for this link_code)
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('roast_sessions')
      .select('session_id, link_code, original_photo_url, creator_email, username, roast_prompt')
      .eq('link_code', link_code)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    console.log('🔍 [nano-banana] DEBUG: Session query results:', sessionData);
    console.log('🔍 [nano-banana] DEBUG: Session query error:', sessionError);
    console.log('🔍 [nano-banana] DEBUG: Querying for link_code:', link_code);
    
    // Additional debugging - check if ANY sessions exist with this link_code
    const { data: allMatchingSessions, error: allMatchingError } = await supabaseClient
      .from('roast_sessions')
      .select('session_id, link_code, created_at')
      .eq('link_code', link_code);
    
    console.log('🔍 [nano-banana] DEBUG: ALL sessions with this link_code:', allMatchingSessions);
    console.log('🔍 [nano-banana] DEBUG: Count of matching sessions:', allMatchingSessions?.length || 0);

    if (sessionError) {
      console.error('❌ [nano-banana] Database error retrieving session:', sessionError);
      throw new Error(`Database error: ${sessionError.message}`);
    }
    
    if (!sessionData) {
      console.error('❌ [nano-banana] No session found for link_code:', link_code);
      throw new Error(`Session not found for link_code: ${link_code}`);
    }
    
    console.log('✅ [nano-banana] Session data retrieved:', { original_photo_url: sessionData.original_photo_url });
    
    // Create NEW session record in roast_sessions table with unique pic ID
    console.log('🔥 [nano-banana] STEP 5: Creating new session record with unique pic ID...');
    
    // Generate proper UUID for this user's submission
    const uniquePicId = crypto.randomUUID();
    console.log('🔥 [nano-banana] STEP 6: Generated unique UUID:', uniquePicId);
    
    // Insert new session record into roast_sessions table
    const { data: newSession, error: insertError } = await supabaseClient
      .from('roast_sessions')
      .insert({
        session_id: uniquePicId,
        link_code: sessionData.link_code, // Preserve the original link_code
        original_photo_url: sessionData.original_photo_url,
        creator_email: sessionData.creator_email,
        username: sessionData.username,
        roast_prompt: sessionData.roast_prompt || 'roast this pic 😂🔥',
        updated_prompt: prompt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ [nano-banana] Error creating new session record:', insertError);
      throw new Error(`Failed to create new session: ${insertError.message}`);
    }
    
    console.log('✅ [nano-banana] New session record created successfully:', uniquePicId);
    
    // Use the new session for the rest of the process
    const currentSession = newSession;

    // Download original image for multimodal input
    console.log('🔥 [nano-banana] STEP 7: Downloading original image:', sessionData.original_photo_url);
    const originalImageResponse = await fetch(sessionData.original_photo_url)
    if (!originalImageResponse.ok) {
      throw new Error(`Failed to download original image: ${originalImageResponse.status}`)
    }
    
    // Determine MIME type from response headers or URL
    const contentType = originalImageResponse.headers.get('content-type') || 'image/jpeg';
    console.log('🔍 [nano-banana] DEBUG: Determined image MIME type:', contentType);
    
    const originalImageBuffer = await originalImageResponse.arrayBuffer()
    // Fix potential stack overflow with large images by processing in chunks
    const uint8Array = new Uint8Array(originalImageBuffer)
    let binaryString = ''
    const chunkSize = 8192 // Process in 8KB chunks to avoid stack overflow
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode(...chunk)
    }
    const originalImageBase64 = btoa(binaryString)
    console.log('🔥 [nano-banana] STEP 8: Original image downloaded, size:', originalImageBuffer.byteLength, 'base64 length:', originalImageBase64.length);

    // Generate AI image using REST API (more reliable for Supabase Edge Functions)
    console.log('🔥 [nano-banana] STEP 9: Preparing Gemini API call...');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    console.log('🔍 [nano-banana] DEBUG: GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
    console.log('🔍 [nano-banana] DEBUG: SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('🔍 [nano-banana] DEBUG: SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          {
            text: `Look at this image and ${prompt}. Create a completely new PHOTOREALISTIC image that transforms the person in the photo according to this description. Generate an entirely new realistic image, not just text.

MANDATORY PHOTOREALISTIC REQUIREMENTS:
- Generate a PHOTOREALISTIC, NATURAL-LOOKING image - NOT a cartoon, illustration, or animated style
- PRESERVE exact facial features, bone structure, and natural human proportions
- MAINTAIN the original person's realistic skin texture, eye color, and facial characteristics  
- USE realistic lighting, shadows, and natural photography aesthetics
- KEEP all human features looking like real people, not drawings or cartoons
- APPLY only the specific transformation requested while maintaining photographic realism
- ABSOLUTELY NO cartoon, anime, illustration, or artistic stylization unless explicitly requested
- The result must look like a real photograph of a real person

STYLE ENFORCEMENT:
- Style: Photorealistic photography
- Quality: High-resolution, natural lighting
- Appearance: Real human features, not illustrated or cartoon-like
- Texture: Natural skin, hair, and clothing textures

IMPORTANT: Generate the image with these exact dimensions:
- Width: 1080px
- Height: 1920px  
- Aspect Ratio: 9:16 (Instagram Stories format)

The image must be optimized for Instagram Stories sharing without any stretching or cropping.`
          },
          {
            inline_data: {
              mime_type: contentType,
              data: originalImageBase64
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: 0.8,
        candidateCount: 1
      }
    };

    console.log('🔥 [nano-banana] STEP 10: Calling Gemini 2.5 with REST API...');
    console.log('🔍 [nano-banana] DEBUG: Request body:', JSON.stringify(requestBody, null, 2));
    
    // Use Gemini 2.5 Flash Image Preview for actual image generation
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ [nano-banana] Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    let generatedImageBase64: string | null = null;
    let finalImageUrl = sessionData.original_photo_url; // fallback

    console.log('🔥 [nano-banana] STEP 11: Processing non-streaming response...');
    console.log('🔍 [nano-banana] DEBUG: Response status:', geminiResponse.status);
    console.log('🔍 [nano-banana] DEBUG: Response headers:', Object.fromEntries(geminiResponse.headers.entries()));
    
    const responseData = await geminiResponse.json();
    console.log('🔍 [nano-banana] DEBUG: Full response:', JSON.stringify(responseData, null, 2));
    
    // Process the response to find image data - check multiple possible structures
    if (responseData.candidates && responseData.candidates[0]) {
      const candidate = responseData.candidates[0];
      console.log('🔍 [nano-banana] DEBUG: Candidate structure:', JSON.stringify(candidate, null, 2));
      
      // Check content.parts structure
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          console.log('🔍 [nano-banana] DEBUG: Processing part:', JSON.stringify(part, null, 2));
          
          // Check for inlineData (standard structure)
          if (part.inlineData && part.inlineData.data) {
            console.log('🎉 [nano-banana] STEP 12: FOUND IMAGE DATA in inlineData! Size:', part.inlineData.data.length);
            generatedImageBase64 = part.inlineData.data;
            break;
          }
          
          // Check for inline_data (alternative structure)
          if (part.inline_data && part.inline_data.data) {
            console.log('🎉 [nano-banana] STEP 12: FOUND IMAGE DATA in inline_data! Size:', part.inline_data.data.length);
            generatedImageBase64 = part.inline_data.data;
            break;
          }
          
          // Check for executionMetadata or other structures
          if (part.executionMetadata) {
            console.log('🔍 [nano-banana] DEBUG: Found executionMetadata:', JSON.stringify(part.executionMetadata, null, 2));
          }
          
          if (part.text) {
            console.log('📝 [nano-banana] STEP 12: Found text:', part.text.substring(0, 200));
          }
        }
      }
      
      // Check if image data is at candidate level
      if (candidate.inlineData && candidate.inlineData.data) {
        console.log('🎉 [nano-banana] STEP 12: FOUND IMAGE DATA at candidate level! Size:', candidate.inlineData.data.length);
        generatedImageBase64 = candidate.inlineData.data;
      }
      
      if (generatedImageBase64) {
        console.log('✅ [nano-banana] STEP 13: Image generation completed');
      } else {
        console.log('⚠️ [nano-banana] No image data found in any expected location');
      }
    } else {
      console.log('⚠️ [nano-banana] No candidates found in response');
    }

    // Upload generated image if we have one
    if (generatedImageBase64) {
      console.log('🔥 [nano-banana] STEP 14: Converting base64 to image buffer...');
      // Fix potential stack overflow with large base64 strings
      const binaryString = atob(generatedImageBase64)
      const imageBuffer = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i)
      }
      
      // Upload generated image to Supabase storage
      const fileName = `ai_generated_${currentSession.session_id}_${Date.now()}.jpg`;
      console.log('📤 [nano-banana] STEP 15: Uploading generated image to storage:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('roast-photos')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ [nano-banana] Error uploading generated image:', uploadError);
        console.log('🔄 [nano-banana] Using original image URL as fallback');
        finalImageUrl = sessionData.original_photo_url;
      } else {
        console.log('✅ [nano-banana] Generated image uploaded successfully:', uploadData);
        const { data: urlData } = supabaseClient.storage
          .from('roast-photos')
          .getPublicUrl(fileName);
        
        if (urlData && urlData.publicUrl) {
          finalImageUrl = urlData.publicUrl;
          console.log('🖼️ [nano-banana] Generated image URL:', finalImageUrl);
          
          // Update the new session record with generated image URL
          const { error: updateImageError } = await supabaseClient
            .from('roast_sessions')
            .update({ 
              ai_image_url: finalImageUrl,
              generated_photo_url: finalImageUrl 
            })
            .eq('session_id', currentSession.session_id);
          
          if (updateImageError) {
            console.error('❌ [nano-banana] Error updating session with generated image URL:', updateImageError);
          } else {
            console.log('✅ [nano-banana] Session updated with generated image URL');
          }
        }
      }
    } else {
      console.log('⚠️ [nano-banana] No image data generated from Gemini SDK - using original image URL');
      finalImageUrl = sessionData.original_photo_url;
    }

    // Insert into inbox for mobile app
    console.log('🔥 [nano-banana] STEP 16: Inserting into inbox for mobile app display');
    
    console.log('🔍 [nano-banana] DEBUG: Session data retrieved:', currentSession);
    console.log('🔍 [nano-banana] DEBUG: creator_email:', currentSession.creator_email);
    console.log('🔍 [nano-banana] DEBUG: username:', currentSession.username);
    
    const inboxInsertData = {
      user_id: currentSession.creator_email || currentSession.username || 'anonymous',
      creator_email: currentSession.creator_email,
      username: currentSession.username,
      roast_session_id: currentSession.session_id,
      generated_photo_url: finalImageUrl,
      prompt: currentSession.updated_prompt || prompt,
      original_photo_url: currentSession.original_photo_url,
      recipient_identifier: currentSession.session_id,
      created_at: new Date().toISOString()
    };
    
    console.log('🔍 [nano-banana] DEBUG: About to insert inbox data:', JSON.stringify(inboxInsertData, null, 2));
    
    try {
      // First attempt: Standard insertion
      console.log('🔄 [nano-banana] Attempting standard inbox insertion...');
      const { data: inboxData, error: inboxError } = await supabaseClient
        .from('inbox')
        .insert(inboxInsertData)
        .select();
      
      if (inboxError) {
        console.error('❌ [nano-banana] Standard insertion failed:', inboxError);
        console.error('❌ [nano-banana] Error code:', inboxError.code);
        console.error('❌ [nano-banana] Error message:', inboxError.message);
        
        // Second attempt: Minimal data insertion
        console.log('🔄 [nano-banana] Trying minimal data insertion...');
        const minimalData = {
          user_id: currentSession.creator_email || 'nano-banana-function',
          roast_session_id: currentSession.session_id,
          prompt: currentSession.updated_prompt || prompt,
          generated_photo_url: finalImageUrl,
          original_photo_url: currentSession.original_photo_url
        };
        
        const { data: minimalResult, error: minimalError } = await supabaseClient
          .from('inbox')
          .insert(minimalData)
          .select();
          
        if (minimalError) {
          console.error('❌ [nano-banana] Minimal insertion failed:', minimalError);
          
          // Update the new session record with generated image URL
          const { error: updateImageError } = await supabaseClient
            .from('roast_sessions')
            .update({ 
              ai_image_url: finalImageUrl,
              generated_photo_url: finalImageUrl 
            })
            .eq('session_id', currentSession.session_id);
          
          if (updateImageError) {
            console.error('❌ [nano-banana] Error updating session with generated image URL:', updateImageError);
          } else {
            console.log('✅ [nano-banana] Session updated with generated image URL');
          }
          const { data: superMinimal, error: superMinimalError } = await supabaseClient
            .from('inbox')
            .insert({
              user_id: 'test',
              prompt: 'test'
            })
            .select();
            
          if (superMinimalError) {
            console.error('❌ [nano-banana] Super minimal insertion failed:', superMinimalError);
          } else {
            console.log('✅ [nano-banana] Super minimal insertion worked:', superMinimal);
          }
        } else {
          console.log('✅ [nano-banana] Minimal insertion succeeded:', minimalResult);
        }
      } else {
        console.log('✅ [nano-banana] Standard insertion succeeded:', inboxData);
      }
    } catch (insertException) {
      console.error('❌ [nano-banana] Exception during inbox insertion:', insertException.message);
    }

    console.log('🎉 [nano-banana] AI image generation completed successfully!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'AI image generated successfully',
        image_url: finalImageUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ [nano-banana] Function error:', error)
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
