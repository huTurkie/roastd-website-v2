-- Create a function to insert into inbox table bypassing RLS
CREATE OR REPLACE FUNCTION insert_inbox_message(
  p_user_id TEXT,
  p_roast_session_id UUID,
  p_generated_photo_url TEXT,
  p_ai_image_url TEXT,
  p_prompt TEXT,
  p_original_photo_url TEXT,
  p_recipient_identifier TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO inbox (
    user_id,
    roast_session_id,
    generated_photo_url,
    ai_image_url,
    prompt,
    original_photo_url,
    recipient_identifier,
    created_at
  )
  VALUES (
    p_user_id,
    p_roast_session_id,
    p_generated_photo_url,
    p_ai_image_url,
    p_prompt,
    p_original_photo_url,
    p_recipient_identifier,
    NOW()
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
