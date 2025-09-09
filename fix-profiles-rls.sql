-- Fix RLS policies for profiles table to allow user registration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies that work with auth.uid()
CREATE POLICY "Enable read access for users based on user_id" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Also allow delete for completeness
CREATE POLICY "Enable delete for users based on user_id" ON profiles
  FOR DELETE USING (auth.uid() = id);
