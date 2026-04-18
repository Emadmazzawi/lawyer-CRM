-- Migration to add day_of_week to routine_steps

-- Add day_of_week column to routine_steps table
-- If day_of_week is null, it applies to all scheduled days
-- If it has a value (e.g. 0-6 for Sun-Sat), it applies only to that specific day
ALTER TABLE routine_steps ADD COLUMN IF NOT EXISTS day_of_week integer NULL;

-- Add a check constraint to ensure valid days if we use 0-6 (0=Sun, 6=Sat)
ALTER TABLE routine_steps ADD CONSTRAINT check_day_of_week 
  CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));
