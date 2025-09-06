// Get inbox table columns by trying to select all
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getInboxColumns() {
  console.log('🔍 Getting inbox table structure...')
  
  // Try to get table structure by attempting different common column combinations
  const possibleColumns = [
    'id',
    'user_id', 
    'session_id',
    'roast_session_id',
    'prompt',
    'message',
    'text',
    'content',
    'image_url',
    'photo_url',
    'original_photo_url',
    'generated_photo_url',
    'ai_image_url',
    'recipient_identifier',
    'device_id',
    'created_at',
    'updated_at'
  ]
  
  // Test each column individually
  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('inbox')
        .select(column)
        .limit(1)
      
      if (!error) {
        console.log(`✅ Column exists: ${column}`)
      }
    } catch (err) {
      // Column doesn't exist, ignore
    }
  }
  
  // Try to insert with just an ID to see what's required
  console.log('\n🧪 Testing minimal insert...')
  try {
    const { data, error } = await supabase
      .from('inbox')
      .insert({})
      .select()
    
    if (error) {
      console.log('❌ Minimal insert error:', error.message)
      // This will tell us what columns are required
    } else {
      console.log('✅ Minimal insert success:', data)
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }
}

getInboxColumns().catch(console.error)
