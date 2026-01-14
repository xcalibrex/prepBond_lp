-- Add onboarding_complete to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Sync existing status from auth.users metadata if possible
-- Note: This requires a bit of complex SQL if we want to reach into auth.users, 
-- but simpler to just let users re-onboard or update them.
-- For now, let's just add the column.
