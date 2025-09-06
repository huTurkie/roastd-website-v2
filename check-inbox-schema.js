// Check inbox table schema
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkInboxSchema() {
  console.log('🔍 Checking inbox table schema...')
  
  // Try to insert with minimal data to see what columns are required/available
  const testInserts = [
    // Test 1: Basic fields
    {
      roast_session_id: '8a3af5ba-2435-4f3b-b5dc-c338f979c28e',
      message: 'Test 1'
    },
    // Test 2: Try different column names for image URL
    {
      roast_session_id: '8a3af5ba-2435-4f3b-b5dc-c338f979c28e',
      generated_photo_url: 'https://test.jpg',
      message: 'Test 2'
    },
    // Test 3: Try original_photo_url
    {
      roast_session_id: '8a3af5ba-2435-4f3b-b5dc-c338f979c28e',
      original_photo_url: 'https://test.jpg',
      message: 'Test 3'
    }
  ]
  
  for (let i = 0; i < testInserts.length; i++) {
    console.log(`\n🧪 Test ${i + 1}:`, testInserts[i])
    try {
      const { data, error } = await supabase
        .from('inbox')
        .insert(testInserts[i])
        .select()
      
      if (error) {
        console.log(`❌ Error: ${error.message}`)
      } else {
        console.log(`✅ Success! Inserted:`, data)
        
        // Clean up - delete the test record
        if (data && data[0] && data[0].id) {
          await supabase.from('inbox').delete().eq('id', data[0].id)
          console.log('🧹 Cleaned up test record')
        }
        break // Stop on first success
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`)
    }
  }
}

checkInboxSchema().catch(console.error)
