/*
  # Add Journal Summaries

  1. Changes
    - Add `summary` column to chat_sessions table to store AI-generated daily summaries
    - Add `entry_date` column to track the date of journal entries

  2. Details
    - `summary` stores handwritten-style AI summaries of journal conversations
    - `entry_date` helps organize journal entries by date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'summary'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'entry_date'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN entry_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;