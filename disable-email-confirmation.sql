-- Disable email confirmation for all existing users
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- This will allow all existing users to sign in without confirmation
