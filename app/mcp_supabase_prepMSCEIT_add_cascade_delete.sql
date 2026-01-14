-- Drop and Recreate Foreign Keys with ON DELETE CASCADE

-- 1. profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. user_progress
ALTER TABLE public.user_progress
DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. assessment_history
ALTER TABLE public.assessment_history
DROP CONSTRAINT IF EXISTS assessment_history_user_id_fkey;

ALTER TABLE public.assessment_history
ADD CONSTRAINT assessment_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 4. roadmap_tasks
ALTER TABLE public.roadmap_tasks
DROP CONSTRAINT IF EXISTS roadmap_tasks_user_id_fkey;

ALTER TABLE public.roadmap_tasks
ADD CONSTRAINT roadmap_tasks_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 5. tutor_bookings
ALTER TABLE public.tutor_bookings
DROP CONSTRAINT IF EXISTS tutor_bookings_user_id_fkey;

ALTER TABLE public.tutor_bookings
ADD CONSTRAINT tutor_bookings_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 6. training_modules (created_by)
ALTER TABLE public.training_modules
DROP CONSTRAINT IF EXISTS training_modules_created_by_fkey;

ALTER TABLE public.training_modules
ADD CONSTRAINT training_modules_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;
