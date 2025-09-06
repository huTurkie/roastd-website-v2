// Test script for complete Roastd AI workflow
// This tests the web interface fix and nano-banana function

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testCompleteWorkflow() {
  console.log('🧪 Testing complete Roastd AI workflow...')
  
  // Step 1: Check existing sessions
  console.log('🔍 Checking existing roast sessions...')
  const { data: existingSessions, error: sessionError } = await supabase
    .from('roast_sessions')
    .select('*')
    .limit(5)
  
  if (sessionError) {
    console.error('❌ Error fetching sessions:', sessionError)
    return
  }
  
  console.log('📋 Found', existingSessions?.length || 0, 'existing sessions')
  
  if (existingSessions && existingSessions.length > 0) {
    // Use the first existing session for testing
    const testSession = existingSessions[0]
    console.log('📋 Test session details:')
    console.log('   - Session ID:', testSession.session_id)
    console.log('   - Link Code:', testSession.link_code)
    console.log('   - Original Photo URL:', testSession.original_photo_url)
    console.log('   - Roast Prompt:', testSession.roast_prompt)
    
    // Step 2: Test the nano-banana function with the corrected parameter
    console.log('\n🍌 Testing nano-banana function with link_code:', testSession.link_code)
    
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: testSession.link_code,  // Using link_code (string) not session_id (UUID)
        prompt: 'Turn them into a cartoon superhero with a cape and mask'
      },
    })

    console.log('\n📋 Nano-banana function response:')
    console.log('   - Data:', data)
    console.log('   - Error:', error)
    
    if (error) {
      console.error('❌ Function error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Function executed successfully!')
      
      // Step 3: Check if AI image was generated and saved
      console.log('\n🔍 Checking for generated AI images...')
      const { data: updatedSession, error: updateError } = await supabase
        .from('roast_sessions')
        .select('*')
        .eq('session_id', testSession.session_id)
        .single()
      
      if (updateError) {
        console.error('❌ Error fetching updated session:', updateError)
      } else {
        console.log('📋 Updated session data:')
        console.log('   - AI Image URL:', updatedSession.ai_image_url)
        console.log('   - Generated Photo URL:', updatedSession.generated_photo_url)
        console.log('   - Updated at:', updatedSession.updated_at)
        
        // Step 4: Check inbox for mobile app
        console.log('\n📥 Checking inbox for mobile app...')
        const { data: inboxItems, error: inboxError } = await supabase
          .from('inbox')
          .select('*')
          .eq('roast_session_id', testSession.session_id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (inboxError) {
          console.error('❌ Error fetching inbox:', inboxError)
        } else if (inboxItems && inboxItems.length > 0) {
          console.log('✅ Found inbox item for mobile app:')
          console.log('   - Inbox ID:', inboxItems[0].id)
          console.log('   - Image URL:', inboxItems[0].image_url)
          console.log('   - Created at:', inboxItems[0].created_at)
        } else {
          console.log('⚠️ No inbox items found for this session')
        }
      }
    }
    
    // Step 5: Test web interface URL
    console.log('\n🌐 Web interface test URL:')
    console.log(`   http://localhost:8080/unique-pic-id/?code=${testSession.link_code}`)
    
  } else {
    console.log('❌ No existing sessions found to test with')
    console.log('💡 You may need to create a session first using the mobile app')
  }
}

testCompleteWorkflow().catch(console.error)
