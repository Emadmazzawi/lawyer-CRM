-- Migration to add start_time to routine_steps

-- Add start_time column to routine_steps table
-- Optional field storing a time as 'HH:mm' or similar text format
ALTER TABLE routine_steps ADD COLUMN IF NOT EXISTS start_time text NULL;
