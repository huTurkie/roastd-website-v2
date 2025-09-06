// Debug inbox tables and check what exists
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debugInboxTables() {
  console.log('🔍 Debugging inbox tables...')
  
  // Try different possible inbox table names
  const tableNames = ['inbox', 'roast_inbox', 'messages', 'roast_messages', 'submissions']
  
  for (const tableName of tableNames) {
    console.log(`\n📋 Checking table: ${tableName}`)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5)
      
      if (error) {
        console.log(`❌ Error: ${error.message}`)
      } else {
        console.log(`✅ Found ${data?.length || 0} records`)
        if (data && data.length > 0) {
          console.log('📋 Sample record:', data[0])
          console.log('📋 Columns:', Object.keys(data[0]))
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`)
    }
  }
  
  // Test inserting into inbox table (the one used in nano-banana function)
  console.log('\n🧪 Testing inbox insertion...')
  try {
    const testData = {
      roast_session_id: '8a3af5ba-2435-4f3b-b5dc-c338f979c28e', // Use the session we know exists
      image_url: 'https://test-image-url.com/test.jpg',
      message: 'Test message from debug script'
    }
    
    const { data, error } = await supabase
      .from('inbox')
      .insert(testData)
      .select()
    
    if (error) {
      console.error('❌ Error inserting test data:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Successfully inserted test data:', data)
    }
  } catch (err) {
    console.error('❌ Exception during insertion:', err.message)
  }
}

debugInboxTables().catch(console.error)
