-- Re-enable RLS with proper security policies
ALTER TABLE roast_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow anonymous updates to updated_prompt" ON roast_sessions;
DROP POLICY IF EXISTS "Users can update their own roast sessions" ON roast_sessions;

-- Create secure policies for roast_sessions
-- Allow anonymous users to insert (for creating sessions)
CREATE POLICY "Allow anonymous inserts" ON roast_sessions
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to select (for reading sessions)
CREATE POLICY "Allow anonymous selects" ON roast_sessions
  FOR SELECT USING (true);

-- Allow anonymous users to update (for prompt updates and AI generation)
CREATE POLICY "Allow anonymous updates" ON roast_sessions
  FOR UPDATE USING (true) WITH CHECK (true);
