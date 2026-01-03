-- SYNC PROFILES WITH AUTH METADATA
-- This script ensures that the 'full_name' in the public.profiles table 
-- matches the one in Supabase Auth metadata. 
-- Run this if the wrong author name is appearing on announcements.

UPDATE public.profiles
SET full_name = auth.users.raw_user_meta_data->>'full_name'
FROM auth.users
WHERE profiles.id = auth.users.id
AND (
    profiles.full_name IS NULL 
    OR profiles.full_name = '' 
    OR profiles.full_name != auth.users.raw_user_meta_data->>'full_name'
);
