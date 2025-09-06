-- Add username column to roast_sessions table
ALTER TABLE roast_sessions 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_roast_sessions_username ON roast_sessions(username);

-- Update existing records to have a default username (optional)
-- UPDATE roast_sessions SET username = 'anonymous' WHERE username IS NULL;
