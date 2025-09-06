// Debug what tables and data actually exist
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function debugTables() {
  console.log('🔍 Debugging database tables and data...')
  
  // Try different possible table names
  const tableNames = ['roast_sessions', 'roast-sessions', 'sessions', 'roast_session']
  
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
          
          // Check if PbuM12o exists in this table
          const { data: specificRecord, error: specificError } = await supabase
            .from(tableName)
            .select('*')
            .eq('link_code', 'PbuM12o')
          
          if (specificError) {
            console.log(`❌ Error searching for PbuM12o: ${specificError.message}`)
          } else {
            console.log(`🔍 Records with link_code 'PbuM12o': ${specificRecord?.length || 0}`)
            if (specificRecord && specificRecord.length > 0) {
              console.log('✅ Found PbuM12o record:', specificRecord[0])
            }
          }
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`)
    }
  }
}

debugTables().catch(console.error)
