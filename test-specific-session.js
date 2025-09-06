// Test with the specific session from the database
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testSpecificSession() {
  console.log('🧪 Testing with specific session PbuM12o...')
  
  // First verify the session exists
  const { data: session, error: sessionError } = await supabase
    .from('roast_sessions')
    .select('*')
    .eq('link_code', 'PbuM12o')
    .single()
  
  if (sessionError) {
    console.error('❌ Error finding session:', sessionError)
    return
  }
  
  console.log('✅ Found session:', {
    session_id: session.session_id,
    link_code: session.link_code,
    original_photo_url: session.original_photo_url,
    roast_prompt: session.roast_prompt
  })
  
  // Now test the nano-banana function
  console.log('🍌 Testing nano-banana function...')
  const { data, error } = await supabase.functions.invoke('nano-banana', {
    body: { 
      link_code: 'PbuM12o',
      prompt: 'Put them in a movie poster 🎬'
    },
  })

  console.log('📋 Response data:', data)
  
  if (error) {
    console.log('📋 Response error:', error.message)
    if (error.context) {
      try {
        const responseText = await error.context.text()
        console.log('📋 Response body:', responseText)
      } catch (e) {
        console.log('📋 Could not read response body')
      }
    }
  } else {
    console.log('✅ Function executed successfully!')
  }
}

testSpecificSession().catch(console.error)
