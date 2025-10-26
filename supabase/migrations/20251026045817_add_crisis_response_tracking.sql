/*
  # Add Crisis Response Tracking

  1. Changes
    - Add `is_crisis_response` column to `chat_messages` table to flag crisis protocol responses
    - This enables tracking when the crisis protocol is triggered and analyzing patterns

  2. Notes
    - Column defaults to false for existing messages
    - Helps with analytics and ensuring proper crisis response handling
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'is_crisis_response'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN is_crisis_response boolean DEFAULT false;
  END IF;
END $$;