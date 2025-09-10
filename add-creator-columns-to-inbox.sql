-- Add creator_email and username columns to inbox table to match roast_sessions
ALTER TABLE inbox 
ADD COLUMN IF NOT EXISTS creator_email TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- This will standardize the column naming between tables
