-- routines_migration.sql

-- Create routines table
CREATE TABLE routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Routines Policies
CREATE POLICY "Users can create their own routines" ON routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own routines" ON routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON routines FOR DELETE USING (auth.uid() = user_id);

-- Create routine_steps table
CREATE TABLE routine_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    duration_in_seconds INTEGER NOT NULL,
    order_index INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;

-- Routine Steps Policies
CREATE POLICY "Users can create steps for their routines" ON routine_steps FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can view steps of their routines" ON routine_steps FOR SELECT USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can update steps of their routines" ON routine_steps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
);
CREATE POLICY "Users can delete steps of their routines" ON routine_steps FOR DELETE USING (
    EXISTS (SELECT 1 FROM routines WHERE routines.id = routine_id AND routines.user_id = auth.uid())
);
