-- Test prompt update for link code vRlBaMyE
SELECT session_id, link_code, roast_prompt, updated_prompt, created_at, updated_at
FROM roast_sessions 
WHERE link_code = 'vRlBaMyE';

-- Check if this link_code exists at all
SELECT COUNT(*) as count_found
FROM roast_sessions 
WHERE link_code = 'vRlBaMyE';

-- Check recent sessions to see what link_codes actually exist
SELECT session_id, link_code, roast_prompt, creator_email, created_at
FROM roast_sessions 
ORDER BY created_at DESC 
LIMIT 10;
