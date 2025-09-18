-- Remove UNIQUE constraint from link_code to allow multiple users per link
ALTER TABLE public.roast_sessions DROP CONSTRAINT IF EXISTS roast_sessions_link_code_key;