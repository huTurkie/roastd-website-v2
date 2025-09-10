-- Check existing roast_sessions to see if they have user data
SELECT session_id, creator_email, username, link_code, created_at 
FROM roast_sessions 
ORDER BY created_at DESC 
LIMIT 10;
