/*
  # Add Chat Personalization Features

  1. Changes
    - Add `chat_background` column to profiles table for background theme preference
    - Add `emoji_enabled` column to profiles table for emoji/GIF feature toggle

  2. Details
    - `chat_background` stores the selected background theme (nature, animals, abstract, sky, universe, gradient, solid)
    - `emoji_enabled` allows users to toggle emoji/GIF picker on or off
    - Both columns have sensible defaults
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'chat_background'
  ) THEN
    ALTER TABLE profiles ADD COLUMN chat_background text DEFAULT 'gradient';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emoji_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emoji_enabled boolean DEFAULT true;
  END IF;
END $$;