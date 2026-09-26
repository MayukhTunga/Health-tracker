-- Step 1: Wipe all dummy data (EXCEPT exercises)
DELETE FROM public.sets;
DELETE FROM public.workouts;
DELETE FROM public.template_exercises;
DELETE FROM public.templates;
DELETE FROM public.profiles;

-- Step 2: Update Profiles Schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- (Optional) If we previously made profiles.id NOT reference auth.users, we should fix it now.
-- But assuming it's just a uuid, that's fine. We will insert profiles via a trigger or manually when a user signs up.

-- Step 3: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Policies
-- Exercises: Everyone can read
CREATE POLICY "Allow public read access to exercises" ON public.exercises FOR SELECT USING (true);

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Templates: Users can only see/edit their own
CREATE POLICY "Users manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);

-- Template Exercises: Linked via template_id (For simplicity, we check if the user owns the template)
CREATE POLICY "Users manage own template exercises" ON public.template_exercises FOR ALL 
USING (EXISTS (SELECT 1 FROM public.templates WHERE id = template_exercises.template_id AND user_id = auth.uid()));

-- Workouts: Users can only see/edit their own
CREATE POLICY "Users manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);

-- Sets: Linked via workout_id
CREATE POLICY "Users manage own sets" ON public.sets FOR ALL 
USING (EXISTS (SELECT 1 FROM public.workouts WHERE id = sets.workout_id AND user_id = auth.uid()));

-- Storage Bucket Policies (Assumes bucket 'avatars' is created)
-- Note: User needs to create the 'avatars' bucket manually via Dashboard as requested in the plan.
