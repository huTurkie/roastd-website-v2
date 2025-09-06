-- Update the RPC function to handle username parameter
CREATE OR REPLACE FUNCTION create_roast_session_for_anon(
    photo_url TEXT,
    prompt TEXT,
    code TEXT,
    creator_email_param TEXT DEFAULT NULL,
    username_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_session_id UUID;
BEGIN
    INSERT INTO roast_sessions (
        creator_email,
        username,
        original_photo_url,
        roast_prompt,
        link_code,
        created_at
    ) VALUES (
        creator_email_param,
        username_param,
        photo_url,
        prompt,
        code,
        NOW()
    )
    RETURNING session_id INTO new_session_id;
    
    RETURN new_session_id;
END;
$$;
