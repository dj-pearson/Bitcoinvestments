-- Fix Existing Users Migration
-- This script creates user profiles for existing Supabase Auth users
-- who don't have a corresponding row in the public.users table

-- Insert missing user profiles from auth.users
INSERT INTO public.users (id, email, referral_code, created_at)
SELECT 
    au.id,
    au.email,
    public.generate_referral_code(),
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Display the fixed users
SELECT 
    u.id,
    u.email,
    u.referral_code,
    u.created_at
FROM public.users u
ORDER BY u.created_at DESC;

