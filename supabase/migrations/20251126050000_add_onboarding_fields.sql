-- Add onboarding fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BDT';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fixed_costs numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goal text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS communication_style text DEFAULT 'friendly';

-- Grant permissions
GRANT ALL ON profiles TO postgres;
GRANT ALL ON profiles TO service_role;
