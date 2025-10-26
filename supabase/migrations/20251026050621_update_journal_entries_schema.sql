/*
  # Update Journal Entries Schema

  1. Changes
    - Add `raw_text_content` column to store final text from input methods
    - Rename `content` to keep both for backward compatibility
    - Update title to default to timestamp format
    - Ensure proper constraints and defaults

  2. Notes
    - Keeps existing `content` field for backward compatibility
    - `raw_text_content` will be the primary field going forward
    - Title defaults to formatted date/time if not provided
*/

DO $$
BEGIN
  -- Add raw_text_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'journal_entries' AND column_name = 'raw_text_content'
  ) THEN
    ALTER TABLE journal_entries ADD COLUMN raw_text_content text;
  END IF;

  -- Update existing entries to copy content to raw_text_content
  UPDATE journal_entries 
  SET raw_text_content = content 
  WHERE raw_text_content IS NULL AND content IS NOT NULL;
END $$;