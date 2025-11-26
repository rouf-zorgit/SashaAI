-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Grant permissions just in case (though RLS policies handle row access)
GRANT ALL ON profiles TO postgres;
GRANT ALL ON profiles TO service_role;
