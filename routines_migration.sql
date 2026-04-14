-- routines_migration.sql
-- Description: Creates routines and routine_steps tables with strict RLS policies.

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE routines IS 'Routines created by users for habit tracking.';

-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Routines Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can create their own routines" ON routines;
    CREATE POLICY "Users can create their own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view their own routines" ON routines;
    CREATE POLICY "Users can view their own routines" ON routines FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own routines" ON routines;
    CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own routines" ON routines;
    CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create routine_steps table
CREATE TABLE IF NOT EXISTS routine_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration_in_seconds INTEGER NOT NULL,
    order_index INTEGER NOT NULL
);
COMMENT ON TABLE routine_steps IS 'Steps belonging to a specific routine.';

-- Enable RLS
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;

-- Routine Steps Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can create steps for their routines" ON routine_steps;
    CREATE POLICY "Users can create steps for their routines" ON routine_steps FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Users can view steps of their routines" ON routine_steps;
    CREATE POLICY "Users can view steps of their routines" ON routine_steps FOR SELECT USING (
        EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Users can update steps of their routines" ON routine_steps;
    CREATE POLICY "Users can update steps of their routines" ON routine_steps FOR UPDATE USING (
        EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "Users can delete steps of their routines" ON routine_steps;
    CREATE POLICY "Users can delete steps of their routines" ON routine_steps FOR DELETE USING (
        EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
