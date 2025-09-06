// Test inbox insertion with service role key
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
// Note: This would need the actual service role key from environment
const SUPABASE_SERVICE_KEY = 'your-service-role-key-here'

async function testServiceRoleInsertion() {
  console.log('🧪 Testing inbox insertion with service role...')
  
  // For now, let's try with anon key and see what specific error we get
  const supabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k')
  
  // Test minimal insertion with current session ID
  const testData = {
    user_id: 'test-user',
    roast_session_id: '9336475e-5088-4ad6-b83c-7c1e60f981ab', // Current session ID
    prompt: 'Test prompt',
    original_photo_url: 'https://test.jpg',
    generated_photo_url: 'https://test-generated.jpg',
    ai_image_url: 'https://test-ai.jpg',
    recipient_identifier: 'test-recipient'
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
      console.error('❌ Error hint:', error.hint)
    } else {
      console.log('✅ Success! Inserted:', data)
    }
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

testServiceRoleInsertion().catch(console.error)
