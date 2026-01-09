# MSCEIT Prep (Lumio) - Comprehensive Supabase Schema

To support the full feature set including assessments, training progress, and mentorship, the following schema should be applied.

## 1. User Profiles (`public.profiles`)
Stores extended user information captured during onboarding.

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT, -- e.g., 'student', 'professional'
  goal TEXT, -- e.g., 'exam', 'leadership'
  experience_level TEXT, -- e.g., 'novice', 'advanced'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

## 2. User Progress & Stats (`public.user_progress`)
Single source of truth for current mastery levels and aggregate scores.

```sql
CREATE TABLE public.user_progress (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores UserStats object
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress_updated_at ON public.user_progress (updated_at DESC);
```

## 3. Assessment History (`public.assessment_history`)
Record of every assessment attempt for granular analytics and history views.

```sql
CREATE TABLE public.assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  branch TEXT NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB, -- Optional: Store detailed answers for review
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assessment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history" ON public.assessment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.assessment_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_assessment_history_user_date ON public.assessment_history (user_id, created_at DESC);
```

## 4. Tutor Bookings (`public.tutor_bookings`)
Tracks mentorship sessions (Placeholder for future live booking feature).

```sql
CREATE TABLE public.tutor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tutor_id INTEGER NOT NULL,
  session_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tutor_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" ON public.tutor_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON public.tutor_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 5. Metadata & Global Config
The app uses Supabase Auth's `raw_user_meta_data` for quick onboarding status checks:
- `onboarding_complete`: boolean
- `profile_synced`: boolean
