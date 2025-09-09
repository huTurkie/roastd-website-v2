-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a permissive policy for testing
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for testing" ON profiles FOR ALL USING (true) WITH CHECK (true);
