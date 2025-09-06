// Simple test to isolate the 500 error issue
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testBasicFunction() {
  console.log('🧪 Testing basic nano-banana function call...')
  
  try {
    // Test with minimal parameters to see if function starts
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: 'test123',
        prompt: 'test prompt'
      },
    })

    console.log('📋 Response data:', data)
    console.log('📋 Response error:', error)
    
    // Try to extract more details from the error
    if (error && error.context) {
      const response = error.context
      console.log('📋 Response status:', response.status)
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Try to read the response body for more error details
      try {
        const responseText = await response.text()
        console.log('📋 Response body:', responseText)
      } catch (bodyError) {
        console.log('📋 Could not read response body:', bodyError.message)
      }
    }
    
  } catch (err) {
    console.error('❌ Test error:', err)
  }
}

testBasicFunction().catch(console.error)
