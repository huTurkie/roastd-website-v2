// Test exactly what the web interface does
const { createClient } = require('@supabase/supabase-js')

// Use the same configuration as the web interface
const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testWebInterface() {
  console.log('🌐 Testing web interface flow...')
  
  const linkCode = 'P0uM1I2o'
  const promptText = 'Turn them into an anime character 🎌'
  
  console.log('🌐 Link Code:', linkCode)
  console.log('🌐 Prompt:', promptText)
  
  try {
    console.log('🌐 Submitting prompt to nano-banana function')
    
    const { data, error } = await supabaseClient.functions.invoke('nano-banana', {
      body: { 
        link_code: linkCode,
        prompt: promptText
      },
    })

    console.log('🌐 Nano-banana response - Data:', data)
    console.log('🌐 Nano-banana response - Error:', error)

    if (error) {
      console.error('🌐 Nano-banana function error:', error)
      console.error('🌐 Error details:', JSON.stringify(error, null, 2))
      
      // Check if it's a network/auth error vs function error
      if (error.message) {
        console.error('🌐 Error message:', error.message)
      }
      if (error.context) {
        try {
          const responseText = await error.context.text()
          console.error('🌐 Error response body:', responseText)
        } catch (e) {
          console.error('🌐 Could not read error response body')
        }
      }
      
      throw error
    }

    console.log('🌐 Success! Response data:', JSON.stringify(data, null, 2))
    return data
    
  } catch (error) {
    console.error('🌐 Exception caught:', error)
    console.error('🌐 Exception message:', error.message)
    console.error('🌐 Exception stack:', error.stack)
    console.error('🌐 Full error object:', JSON.stringify(error, null, 2))
    throw error
  }
}

testWebInterface().catch(console.error)
