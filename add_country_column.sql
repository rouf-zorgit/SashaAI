-- Add missing country column to profiles table
-- This fixes the error: "Could not find the 'country' column of 'profiles' in the schema cache"

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'country';
