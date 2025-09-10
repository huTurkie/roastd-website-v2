-- Add ai_image_url column to roast_sessions table
ALTER TABLE roast_sessions 
ADD COLUMN ai_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN roast_sessions.ai_image_url IS 'URL of AI-generated image for this roast session';
