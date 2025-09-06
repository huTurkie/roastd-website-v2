// Test direct inbox insertion with current session data
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testDirectInboxInsertion() {
  console.log('🧪 Testing direct inbox insertion...')
  
  // Use the current session data
  const testData = {
    user_id: 'test-user',
    roast_session_id: '9336475e-5088-4ad6-b83c-7c1e60f981ab',
    generated_photo_url: 'https://test-generated.jpg',
    ai_image_url: 'https://test-ai.jpg', 
    prompt: 'Test direct insertion',
    original_photo_url: 'https://test-original.jpg',
    recipient_identifier: '9336475e-5088-4ad6-b83c-7c1e60f981ab'
  }
  
  console.log('📋 Attempting to insert:', testData)
  
  try {
    const { data, error } = await supabase
      .from('inbox')
      .insert(testData)
      .select()
    
    if (error) {
      console.error('❌ Insertion error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error details:', error.details)
    } else {
      console.log('✅ Success! Inserted:', data)
      
      // Verify it's in the table
      const { data: verifyData } = await supabase
        .from('inbox')
        .select('*')
        .eq('id', data[0].id)
      
      console.log('✅ Verification - record exists:', verifyData)
    }
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

testDirectInboxInsertion().catch(console.error)
