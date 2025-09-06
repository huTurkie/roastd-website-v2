// Test with the correct link code P0uM1I2o
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testCorrectLinkCode() {
  console.log('🧪 Testing with correct link code P0uM1I2o...')
  
  // Test the nano-banana function with correct link code
  const { data, error } = await supabase.functions.invoke('nano-banana', {
    body: { 
      link_code: 'P0uM1I2o',
      prompt: 'Put them in a movie poster 🎬'
    },
  })

  console.log('📋 Response data:', data)
  
  if (error) {
    console.log('❌ Response error:', error.message)
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
    console.log('🎯 Generated image URL:', data?.ai_image_url)
  }
}

testCorrectLinkCode().catch(console.error)
