// Test with a real session from the database
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testWithRealSession() {
  console.log('🧪 Testing with real session from database...')
  
  // First get a real session
  const { data: sessions, error: sessionError } = await supabase
    .from('roast_sessions')
    .select('*')
    .limit(1)
  
  if (sessionError || !sessions || sessions.length === 0) {
    console.error('❌ No sessions found:', sessionError)
    return
  }
  
  const testSession = sessions[0]
  console.log('📋 Using session:', testSession.link_code)
  
  try {
    console.log('🍌 Calling nano-banana with real session...')
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: testSession.link_code,
        prompt: 'Turn them into a superhero with a cape'
      },
    })

    console.log('📋 Response data:', data)
    
    if (error) {
      console.log('📋 Response error:', error.message)
      
      // Get more details from the response
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
    
  } catch (err) {
    console.error('❌ Test error:', err)
  }
}

testWithRealSession().catch(console.error)
