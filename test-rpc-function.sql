-- Test if the RPC function exists and works correctly
SELECT create_roast_session_for_anon(
    'https://example.com/test.jpg',
    'Test prompt',
    'TEST123',
    'test@example.com',
    'testuser'
);

-- Check if the session was created with proper user data
SELECT session_id, creator_email, username, link_code 
FROM roast_sessions 
WHERE link_code = 'TEST123';
