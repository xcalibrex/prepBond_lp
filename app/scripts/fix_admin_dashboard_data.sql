-- 1. Seed Generic Test IDs
INSERT INTO practice_tests (id, title, branch, type, created_at, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'General Assessment', NULL, 'exam', NOW(), 'Comprehensive emotional intelligence assessment'),
  ('00000000-0000-0000-0000-000000000002', 'Perceiving Emotions Assessment', 'PERCEIVING', 'worksheet', NOW(), 'Assessment for Perceiving Emotions'),
  ('00000000-0000-0000-0000-000000000003', 'Using Emotions Assessment', 'USING', 'worksheet', NOW(), 'Assessment for Using Emotions'),
  ('00000000-0000-0000-0000-000000000004', 'Understanding Emotions Assessment', 'UNDERSTANDING', 'worksheet', NOW(), 'Assessment for Understanding Emotions'),
  ('00000000-0000-0000-0000-000000000005', 'Managing Emotions Assessment', 'MANAGING', 'worksheet', NOW(), 'Assessment for Managing Emotions')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  branch = EXCLUDED.branch,
  type = EXCLUDED.type,
  description = EXCLUDED.description;

-- 2. Enable RLS for user_test_sessions (if not already)
ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing admin policy if it exists to avoid conflict/duplication
DROP POLICY IF EXISTS "Admins can view all test sessions" ON user_test_sessions;

-- 4. Create Policy for Admins to view all sessions
CREATE POLICY "Admins can view all test sessions"
ON user_test_sessions
FOR SELECT
TO authenticated
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
