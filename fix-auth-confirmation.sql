-- Disable email confirmation in Supabase auth settings
-- Run this in Supabase SQL Editor

-- Update auth configuration to disable email confirmation
UPDATE auth.config 
SET email_confirm_changes = false, 
    enable_signup = true, 
    enable_confirmations = false
WHERE id = 'default';

-- Also update any existing users to be confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
