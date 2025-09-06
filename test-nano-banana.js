// Test script for nano-banana function
// This creates a test roast session and triggers the function

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ1NjgxMCwiZXhwIjoyMDcyMDMyODEwfQ.myZbcIGI3Zd1zE1qSxPcGCb3aVcjyoJgcMOI3zd8dR0mZzs1cZd1qXx'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNanoBanana() {
  console.log('🧪 Testing nano-banana function with existing session...')
  
  // First, check existing sessions
  console.log('🔍 Checking existing sessions...')
  const { data: existingSessions, error: sessionError } = await supabase
    .from('roast_sessions')
    .select('*')
    .limit(5)
  
  if (sessionError) {
    console.error('❌ Error fetching sessions:', sessionError)
    return
  }
  
  console.log('📋 Existing sessions count:', existingSessions?.length || 0)
  if (existingSessions && existingSessions.length > 0) {
    console.log('📋 First session columns:', Object.keys(existingSessions[0]))
    console.log('📋 First session data:', existingSessions[0])
    
    // Use the first existing session for testing
    const testSession = existingSessions[0]
    const linkCodeValue = testSession.link_code || testSession.code || testSession.session_id
    
    console.log('🧪 Testing with link_code:', linkCodeValue)
    
    // Now test the nano-banana function
    console.log('🍌 Calling nano-banana function...')
    
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: linkCodeValue,
        prompt: 'Turn them into a superhero'
      },
    })

    console.log('📋 Function response - Data:', data)
    console.log('📋 Function response - Error:', error)
    
    if (error) {
      console.error('❌ Function error:', error)
    } else {
      console.log('✅ Function executed successfully!')
    }
  } else {
    console.log('❌ No existing sessions found to test with')
  }
}

testNanoBanana().catch(console.error)
