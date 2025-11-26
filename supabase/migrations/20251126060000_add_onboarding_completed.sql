-- Add onboarding_completed column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Grant permissions
GRANT ALL ON profiles TO postgres;
GRANT ALL ON profiles TO service_role;
