// Test the updated nano-banana function with correct inbox columns
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testUpdatedFunction() {
  console.log('🧪 Testing updated nano-banana function...')
  
  // Check inbox before
  const { data: inboxBefore, error: inboxBeforeError } = await supabase
    .from('inbox')
    .select('*')
  
  console.log('📋 Inbox records before:', inboxBefore?.length || 0)
  
  // Call the function
  const { data, error } = await supabase.functions.invoke('nano-banana', {
    body: { 
      link_code: 'P0uM1I2o',
      prompt: 'Turn them into a space explorer on Mars 🚀'
    },
  })

  console.log('📋 Function response:', data)
  if (error) {
    console.error('❌ Function error:', error)
  }
  
  // Check inbox after
  const { data: inboxAfter, error: inboxAfterError } = await supabase
    .from('inbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('📋 Inbox records after:', inboxAfter?.length || 0)
  if (inboxAfter && inboxAfter.length > 0) {
    console.log('📋 Latest inbox record:', inboxAfter[0])
  }
}

testUpdatedFunction().catch(console.error)
