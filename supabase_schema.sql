-- Supabase Relational Schema for Health Tracker Prototype
-- Option A: Strict Relational SQL

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id uuid primary key default '00000000-0000-0000-0000-000000000000'::uuid,
  name text,
  age integer,
  weight numeric,
  height numeric,
  gender text,
  google_health_sync boolean default false
);

-- Insert dummy profile for prototype
INSERT INTO public.profiles (id, name, age, weight, height, gender, google_health_sync)
VALUES ('00000000-0000-0000-0000-000000000000', 'Guest User', 25, 75, 175, 'Not Specified', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Exercises Table (Reference Library)
CREATE TABLE public.exercises (
  id text primary key,
  name text not null,
  muscle_group text,
  equipment text,
  description text,
  media_url text,
  is_unilateral boolean default false
);

-- 3. Templates Table
CREATE TABLE public.templates (
  id bigint primary key, -- Keeping it numeric to match Date.now() from prototype for easy migration
  user_id uuid references public.profiles(id) default '00000000-0000-0000-0000-000000000000'::uuid not null,
  name text not null,
  desc_text text
);

-- 4. Template Exercises (Linking templates to exercises)
CREATE TABLE public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id bigint references public.templates(id) on delete cascade not null,
  exercise_id text references public.exercises(id) on delete cascade not null,
  order_index integer not null,
  default_sets jsonb default '[]'::jsonb
);

-- 5. Workouts Table (Completed Sessions)
CREATE TABLE public.workouts (
  id bigint primary key, -- numeric to match prototype
  user_id uuid references public.profiles(id) default '00000000-0000-0000-0000-000000000000'::uuid not null,
  template_id bigint references public.templates(id) on delete set null,
  name text not null,
  date timestamptz not null default now(),
  duration numeric,
  volume numeric
);

-- 6. Sets Table (Logs for workouts)
CREATE TABLE public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_id bigint references public.workouts(id) on delete cascade not null,
  exercise_id text references public.exercises(id) on delete cascade not null,
  weight numeric,
  reps integer,
  completed boolean default false,
  side text,
  set_order integer not null
);

-- Enable Row Level Security (RLS) - Disabled for rapid prototyping, but good practice to turn on later
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
