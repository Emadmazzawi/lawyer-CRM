-- step_completions_migration.sql
-- Description: Creates step_completions table to track daily completion of specific routine steps.

CREATE TABLE IF NOT EXISTS step_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id UUID REFERENCES routine_steps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date_string VARCHAR NOT NULL,  -- e.g. '2026-04-03'
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(step_id, date_string)
);
COMMENT ON TABLE step_completions IS 'Tracks daily completions of specific routine steps by users.';

-- Enable RLS
ALTER TABLE step_completions ENABLE ROW LEVEL SECURITY;

-- Step Completions Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can create their own step completions" ON step_completions;
    CREATE POLICY "Users can create their own step completions" ON step_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view their own step completions" ON step_completions;
    CREATE POLICY "Users can view their own step completions" ON step_completions FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own step completions" ON step_completions;
    CREATE POLICY "Users can delete their own step completions" ON step_completions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
