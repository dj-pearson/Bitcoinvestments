-- Set specific user as admin
-- This migration grants admin privileges to Pearsonperformance@gmail.com

-- Update existing user to admin (if they exist)
-- Note: This won't work in shadow database during migrations but will work in real database
UPDATE public.users
SET 
  role = 'super_admin',
  updated_at = NOW()
WHERE LOWER(email) = LOWER('Pearsonperformance@gmail.com');
