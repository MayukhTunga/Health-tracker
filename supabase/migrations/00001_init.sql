-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Exercises Table
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    muscle_group TEXT,
    equipment TEXT,
    image_url TEXT, -- URL to diagram or gif
    is_unilateral BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workouts Table
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id) eventually
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    name TEXT NOT NULL,
    google_health_sync_id TEXT, -- ID returned from Google Health API to prevent duplicates
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exercise Sets Table
CREATE TABLE public.exercise_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id),
    reps INTEGER NOT NULL,
    weight_kg DECIMAL NOT NULL,
    side TEXT CHECK (side IN ('left', 'right', 'both')) DEFAULT 'both',
    set_order INTEGER NOT NULL DEFAULT 0, -- To maintain set order
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX idx_workouts_user ON public.workouts(user_id);
CREATE INDEX idx_sets_workout ON public.exercise_sets(workout_id);
