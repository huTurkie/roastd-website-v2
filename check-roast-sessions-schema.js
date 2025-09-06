const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nkemjlbpvwmjqpjzgzqo.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZW1qbGJwdndtanFwanpnenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NzU1NDQsImV4cCI6MjA0MDU1MTU0NH0.jgBSahttps://nkemjlbpvwmjqpjzgzqo.supabase.co';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoastSessionsSchema() {
  try {
    console.log('🔍 Checking roast_sessions table schema...');
    
    // Try to select all columns to see what exists
    const { data, error } = await supabase
      .from('roast_sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying roast_sessions:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample roast_sessions record:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📋 Available columns:', Object.keys(data[0]));
      
      // Check specifically for username column
      if ('username' in data[0]) {
        console.log('✅ username column exists');
      } else {
        console.log('❌ username column missing');
      }
    } else {
      console.log('⚠️ No records found in roast_sessions table');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkRoastSessionsSchema();
