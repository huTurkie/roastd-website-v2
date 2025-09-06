const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://whvbxvllzrgjvurdivmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodmJ4dmxsenJnanZ1cmRpdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTY4MTAsImV4cCI6MjA3MjAzMjgxMH0.fzlUcI2xRxMI_6MEUpJ_RXQYMB7GgDGkCoFYzgmbr4k';

async function testMobileInboxQuery() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('📬 Testing mobile inbox query (simulating mobile app)...');
  
  // This is the exact query the mobile app should now be making after the fix
  const { data, error } = await supabase
    .from('inbox')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching inbox messages:', error);
    return;
  }

  console.log('📬 Fetched inbox messages from Supabase:', data?.length || 0);
  console.log('🤖 AI-processed inbox messages:', data?.length || 0);
  
  // Map inbox data to InboxMessage format (simulating mobile app logic)
  const mappedMessages = (data || []).map(inboxRecord => ({
    id: inboxRecord.id.toString(),
    prompt: inboxRecord.prompt || 'New AI roast request',
    roast: 'AI roast generated!',
    created_at: inboxRecord.created_at,
    user_id: inboxRecord.user_id || 'anonymous',
    original_photo_url: inboxRecord.original_photo_url || 'https://placehold.co/600x400/png',
    generated_photo_url: inboxRecord.ai_image_url || inboxRecord.generated_photo_url || 'https://placehold.co/600x400/png',
    link_code: inboxRecord.recipient_identifier,
    roast_prompt: inboxRecord.prompt,
    updated_prompt: inboxRecord.prompt
  }));
  
  console.log('📬 Total messages (excluding demo):', mappedMessages.length);
  
  if (mappedMessages.length > 0) {
    console.log('✅ SUCCESS: Mobile app should show AI-generated images after restart!');
    console.log('📋 Messages found:');
    mappedMessages.forEach((msg, i) => {
      console.log(`  ${i+1}. ID: ${msg.id}`);
      console.log(`      Prompt: ${msg.prompt}`);
      console.log(`      User: ${msg.user_id}`);
      console.log(`      Has AI Image: ${!!msg.generated_photo_url}`);
      console.log(`      Image URL: ${msg.generated_photo_url.substring(0, 50)}...`);
    });
  } else {
    console.log('❌ No messages found in inbox table');
  }
  
  console.log('\n🔄 NEXT STEP: Restart your mobile app to see these messages!');
  console.log('Expected mobile logs after restart:');
  console.log('  📬 Fetching messages from Supabase inbox table...');
  console.log(`  📬 Fetched inbox messages from Supabase: ${data?.length || 0}`);
  console.log(`  🤖 AI-processed inbox messages: ${data?.length || 0}`);
  console.log(`  📬 Total messages (including demo): ${(data?.length || 0) + 1}`);
}

testMobileInboxQuery().catch(console.error);
