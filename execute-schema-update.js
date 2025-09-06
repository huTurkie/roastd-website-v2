const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nkemjlbpvwmjqpjzgzqo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZW1qbGJwdndtanFwanpnenFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDk3NTU0NCwiZXhwIjoyMDQwNTUxNTQ0fQ.YcVBBaU3NJlI5hJJKNRKUQJHCNqxlnhWUhqFZQGZKBM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUsernameColumn() {
  try {
    console.log('🔧 Adding username column to roast_sessions table...');
    
    // Add username column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE roast_sessions 
        ADD COLUMN IF NOT EXISTS username TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_roast_sessions_username 
        ON roast_sessions(username);
      `
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach using direct query
      console.log('🔄 Trying alternative approach...');
      
      const { data: alterData, error: alterError } = await supabase
        .from('roast_sessions')
        .select('username')
        .limit(1);
        
      if (alterError && alterError.code === '42703') {
        console.log('✅ Confirmed: username column does not exist');
        console.log('📝 Please run this SQL in Supabase dashboard:');
        console.log('ALTER TABLE roast_sessions ADD COLUMN username TEXT;');
        console.log('CREATE INDEX idx_roast_sessions_username ON roast_sessions(username);');
      } else {
        console.log('✅ Username column already exists or other issue');
      }
      
      return;
    }
    
    console.log('✅ Successfully added username column');
    
    // Test the column exists
    const { data: testData, error: testError } = await supabase
      .from('roast_sessions')
      .select('username')
      .limit(1);
      
    if (testError) {
      console.error('❌ Error testing username column:', testError);
    } else {
      console.log('✅ Username column is working correctly');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

addUsernameColumn();
