// Test script to verify Gemini API key configuration
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testGeminiKeyConfig() {
  console.log('🧪 Testing Gemini API key configuration...')
  
  try {
    // Create a minimal test function call to check environment variables
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: 'test_key_check',
        prompt: 'test'
      },
    })

    console.log('📋 Response data:', data)
    
    if (error) {
      console.log('📋 Response error:', error.message)
      
      // Try to get the response body for more details
      if (error.context) {
        try {
          const responseText = await error.context.text()
          console.log('📋 Response body:', responseText)
          
          // Parse the error to see if it's about missing API key
          const errorData = JSON.parse(responseText)
          if (errorData.error && errorData.error.includes('GEMINI_API_KEY')) {
            console.log('❌ GEMINI_API_KEY is not configured in Supabase environment variables!')
            console.log('💡 Please add GEMINI_API_KEY to your Supabase project settings > Edge Functions > Environment Variables')
          }
        } catch (e) {
          console.log('📋 Could not parse response body')
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Test error:', err)
  }
}

testGeminiKeyConfig().catch(console.error)
