/*
  # Add Journaling Mode Support

  1. Changes
    - Add `journal_mode` column to chat_sessions table to track mode type
    - Add `is_journal_entry` column to chat_messages table to identify journal entries

  2. Details
    - `journal_mode` stores whether a session is in 'reframe' or 'journal' mode
    - `is_journal_entry` marks messages that are part of journaling sessions
    - Default mode is 'reframe' for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_sessions' AND column_name = 'journal_mode'
  ) THEN
    ALTER TABLE chat_sessions ADD COLUMN journal_mode text DEFAULT 'reframe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_journal_entry'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_journal_entry boolean DEFAULT false;
  END IF;
END $$;