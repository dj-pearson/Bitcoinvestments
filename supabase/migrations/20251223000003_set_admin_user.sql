-- Set specific user as admin
-- This migration grants admin privileges to Pearsonperformance@gmail.com

-- First, ensure the user exists (if not, create them)
INSERT INTO public.users (id, email, role, subscription_status, referral_code)
VALUES (
  'c22e1238-a282-4b50-abcf-3453e3c78162',
  'Pearsonperformance@gmail.com',
  'super_admin',
  'premium',
  public.generate_referral_code()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  subscription_status = 'premium',
  updated_at = NOW();

-- Also try by email in case the ID doesn't match
UPDATE public.users
SET 
  role = 'super_admin',
  subscription_status = 'premium',
  updated_at = NOW()
WHERE LOWER(email) = LOWER('Pearsonperformance@gmail.com');

