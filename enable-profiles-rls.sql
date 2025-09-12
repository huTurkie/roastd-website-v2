  -- Enable RLS on profiles table while maintaining profile creation functionality
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- Drop any existing policies to start fresh
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
  DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
  DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
  DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

  -- Drop additional policies that might exist
  DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow users to create own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow users to delete own profile" ON profiles;

  -- Create secure policies that allow profile creation and management
  -- Allow authenticated users to read their own profile
  CREATE POLICY "Allow users to read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

  -- Allow authenticated users to insert their own profile
  CREATE POLICY "Allow users to create own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

  -- Allow authenticated users to update their own profile
  CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

  -- Allow authenticated users to delete their own profile
  CREATE POLICY "Allow users to delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

  -- Create function to generate unique random usernames
  CREATE OR REPLACE FUNCTION generate_unique_username()
  RETURNS TEXT
  LANGUAGE plpgsql
  AS $$
  DECLARE
      random_username TEXT;
      username_exists BOOLEAN;
  BEGIN
      LOOP
          -- Generate random username: "user" + 6 random digits
          random_username := 'user' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
          
          -- Check if username already exists
          SELECT EXISTS(SELECT 1 FROM profiles WHERE username = random_username) INTO username_exists;
          
          -- If username doesn't exist, we can use it
          IF NOT username_exists THEN
              RETURN random_username;
          END IF;
      END LOOP;
  END;
  $$;

  -- Create trigger function to auto-assign username if null
  CREATE OR REPLACE FUNCTION auto_assign_username()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
  BEGIN
      -- If username is null or empty, generate a random one
      IF NEW.username IS NULL OR NEW.username = '' THEN
          NEW.username := generate_unique_username();
      END IF;
      
      RETURN NEW;
  END;
  $$;

  -- Create trigger to auto-assign username on INSERT
  DROP TRIGGER IF EXISTS trigger_auto_assign_username ON profiles;
  CREATE TRIGGER trigger_auto_assign_username
      BEFORE INSERT ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION auto_assign_username();

  -- Verify RLS is enabled
  SELECT schemaname, tablename, rowsecurity 
  FROM pg_tables 
  WHERE tablename = 'profiles';
