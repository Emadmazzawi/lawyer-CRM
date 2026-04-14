-- routines_v3_migration.sql
-- Description: Enhances routines and routine_steps tables and adds routine_completions table.

-- 1. Add schedule columns to routines
ALTER TABLE routines ADD COLUMN IF NOT EXISTS schedule_type VARCHAR DEFAULT 'scheduled';
ALTER TABLE routines ADD COLUMN IF NOT EXISTS reminder_time VARCHAR DEFAULT NULL;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS active_days JSONB DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'::jsonb;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS alarm_enabled BOOLEAN DEFAULT false;

-- 2. Add emoji column to routine_steps
ALTER TABLE routine_steps ADD COLUMN IF NOT EXISTS emoji VARCHAR DEFAULT NULL;

-- 3. Create routine_completions table
CREATE TABLE IF NOT EXISTS routine_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date_string VARCHAR NOT NULL,  -- e.g. '2026-04-03'
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(routine_id, date_string)
);
COMMENT ON TABLE routine_completions IS 'Tracks daily completions of routines by users.';

-- Enable RLS
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;

-- Routine Completions Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can create their own completions" ON routine_completions;
    CREATE POLICY "Users can create their own completions" ON routine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view their own completions" ON routine_completions;
    CREATE POLICY "Users can view their own completions" ON routine_completions FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own completions" ON routine_completions;
    CREATE POLICY "Users can delete their own completions" ON routine_completions FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
