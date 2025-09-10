-- Fix unconfirmed users in Supabase
-- Run this in Supabase SQL Editor

-- Update any existing users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Note: Email confirmation settings must be disabled in Supabase Dashboard
-- Go to Authentication > Settings > Email Confirmation and set to "Disabled"
