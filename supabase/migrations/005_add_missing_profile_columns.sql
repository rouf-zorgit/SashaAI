-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fixed_costs DECIMAL(10, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS communication_style TEXT;
