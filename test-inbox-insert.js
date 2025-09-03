// Test script to insert a sample inbox message
// Run this in your browser console on the Supabase dashboard

const testMessage = {
  user_id: 'test_user_123',
  prompt: 'Make me look like a superhero with epic powers and a cool costume!',
  original_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  generated_photo_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=400&fit=crop&crop=face',
  recipient_identifier: 'device_test123456789', // Use your actual device ID here
  created_at: new Date().toISOString()
};

// Insert the test message
// You can run this in the Supabase SQL editor:
/*
INSERT INTO inbox (user_id, prompt, original_photo_url, generated_photo_url, recipient_identifier, created_at)
VALUES (
  'test_user_123',
  'Make me look like a superhero with epic powers and a cool costume!',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=400&fit=crop&crop=face',
  'device_test123456789',
  NOW()
);
*/

console.log('Test message data:', testMessage);
console.log('Copy the SQL above and run it in your Supabase SQL editor to create a test message');
