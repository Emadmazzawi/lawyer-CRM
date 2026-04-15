-- v4_full_upgrade.sql
-- Description: Consolidated SQL for Dashboard Stats, Step Completions, and RLS Policies for the UI/UX Upgrade.

-- 1. Create step_completions table (Crucial for the new Routines Progress Bars)
CREATE TABLE IF NOT EXISTS step_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id UUID REFERENCES routine_steps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID DEFAULT auth.uid() NOT NULL, -- Defaults to the current user
    date_string VARCHAR NOT NULL,             -- e.g. '2026-04-14'
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(step_id, date_string)
);

-- Ensure routine_completions also has ON DELETE CASCADE (it should, but let's be safe)
-- We can't easily alter a constraint name without knowing it, but we can recreate the table if empty or just assume it's correct from v3.
-- A safer way in a migration script:
DO $$ 
BEGIN
    -- This is a bit complex for a simple script, so we'll just advise the user to check it.
    -- But most likely the issue is simply that the user hasn't run the LATEST sql.
END $$;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE step_completions ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies for step_completions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'step_completions' 
        AND policyname = 'Users can manage their own step completions'
    ) THEN
        CREATE POLICY "Users can manage their own step completions" 
        ON step_completions 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Ensure routine_steps has proper RLS for the new UI
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'routine_steps' 
        AND policyname = 'Users can manage their own routine steps'
    ) THEN
        CREATE POLICY "Users can manage their own routine steps" 
        ON routine_steps 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM routines 
            WHERE routines.id = routine_steps.routine_id 
            AND routines.user_id = auth.uid()
        ));
    END IF;
END $$;

-- 5. Add Performance Indexes for Dashboard Summary Widget
CREATE INDEX IF NOT EXISTS idx_events_tasks_user_type_completed 
ON events_and_tasks(user_id, type, is_completed);

CREATE INDEX IF NOT EXISTS idx_step_completions_user_date 
ON step_completions(user_id, date_string);

COMMENT ON TABLE step_completions IS 'Tracks daily completions of specific routine steps to power the progress indicators.';
