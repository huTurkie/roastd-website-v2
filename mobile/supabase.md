#1
-- This policy allows any user (even anonymous ones) to create a new roast session.
CREATE POLICY "Allow public insert access"
ON public.roast_sessions
FOR INSERT
WITH CHECK (true);

2#SELECT * FROM storage.buckets WHERE id = 'roast-photos';
#3
SELECT * FROM storage.objects WHERE bucket_id = 'roast-photos';

4#
INSERT INTO storage.buckets (id, name, public) 
VALUES ('roast-photos', 'roast-photos', false);

#5
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'roast-photos';


#6
-- Create proper storage policies for roast-photos bucket
CREATE POLICY "Allow public uploads to roast-photos" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'roast-photos');

CREATE POLICY "Allow public reads from roast-photos" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'roast-photos');

  #7

  -- Enable Row Level Security
ALTER TABLE roast_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roast_submissions ENABLE ROW LEVEL SECURITY;

-- Creators can only see their own sessions
CREATE POLICY "Users can view own sessions" ON roast_sessions
  FOR SELECT USING (creator_email = auth.jwt() ->> 'email');

-- Creators can only create their own sessions  
CREATE POLICY "Users can create own sessions" ON roast_sessions
  FOR INSERT WITH CHECK (creator_email = auth.jwt() ->> 'email');

-- Anyone can view submissions for active sessions (for web client)
CREATE POLICY "View submissions for active sessions" ON roast_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roast_sessions 
      WHERE roast_sessions.session_id = roast_submissions.session_id 
      AND roast_sessions.status = 'active'
    )
  );

-- Anyone can submit to active sessions
CREATE POLICY "Submit to active sessions" ON roast_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roast_sessions 
      WHERE roast_sessions.session_id = roast_submissions.session_id 
      AND roast_sessions.status = 'active'
    )
  );

  #8
  CREATE TABLE roast_submissions (
  submission_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES roast_sessions(session_id) ON DELETE CASCADE,
  responder_email TEXT,
  roast_text TEXT NOT NULL,
  ai_generated_image_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

#9
CREATE TABLE roast_sessions (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_email TEXT NOT NULL,
  original_photo_url TEXT NOT NULL,
  roast_prompt TEXT NOT NULL,
  link_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted'))
);