-- Allow authenticated users to insert their own profile row
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure the update policy is permissive enough (it seems fine based on 'w')
-- But good practice to be explicit if 'w' (UPDATE) is restrictive.
-- The existing 'Users can update their own profile' likely covers UPDATE.
