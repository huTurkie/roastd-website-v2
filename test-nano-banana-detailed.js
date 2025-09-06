const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k';

async function testNanoBananaWithDetailedLogging() {
  console.log('🧪 Testing nano-banana function with detailed response capture...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Check inbox count before
  const { data: beforeData } = await supabase.from('inbox').select('*');
  console.log('📋 Inbox records before:', beforeData?.length || 0);
  
  try {
    // Call nano-banana function
    const { data, error } = await supabase.functions.invoke('nano-banana', {
      body: { 
        link_code: 'SZjQIqRl',
        prompt: 'Detailed test - check inbox insertion logs'
      }
    });

    if (error) {
      console.log('❌ Function error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Function response:', JSON.stringify(data, null, 2));
    }
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check inbox count after
    const { data: afterData } = await supabase.from('inbox').select('*');
    console.log('📋 Inbox records after:', afterData?.length || 0);
    
    if (afterData && beforeData && afterData.length > beforeData.length) {
      console.log('✅ NEW INBOX RECORD CREATED!');
      const newRecord = afterData[afterData.length - 1];
      console.log('📋 New record:', JSON.stringify(newRecord, null, 2));
    } else {
      console.log('❌ NO NEW INBOX RECORD - Check Supabase function logs for detailed error info');
      console.log('🔍 The function has enhanced logging that should show:');
      console.log('   - "🔄 [nano-banana] Attempting standard inbox insertion..."');
      console.log('   - Error codes and messages if insertion fails');
      console.log('   - Whether minimal or super minimal insertion attempts work');
    }
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testNanoBananaWithDetailedLogging().catch(console.error);
