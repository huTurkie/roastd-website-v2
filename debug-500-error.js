// Debug the 500 error from nano-banana function
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debug500Error() {
  console.log('🔍 Debugging 500 error...')
  
  try {
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: 'P0uM1I2o',
        prompt: 'Debug test'
      },
    })

    console.log('📋 Response data:', data)
    console.log('📋 Response error:', error)
    
    if (error && error.context) {
      console.log('📋 Response status:', error.context.status)
      try {
        const responseText = await error.context.text()
        console.log('📋 Response body:', responseText)
      } catch (e) {
        console.log('📋 Could not read response body')
      }
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

debug500Error().catch(console.error)
