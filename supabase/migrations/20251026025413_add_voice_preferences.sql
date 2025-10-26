/*
  # Add Voice Preferences to Profiles

  ## Overview
  Adds voice preference settings to user profiles, allowing users to customize
  the text-to-speech voice used in the chat assistant.

  ## Changes to Existing Tables

  ### profiles
  - Add `voice_preference` (text, nullable) - Stores user's preferred voice name
  - Add `voice_enabled` (boolean, default true) - Whether voice responses are enabled

  ## Important Notes
  1. Voice preferences are stored per user in their profile
  2. Default voice_enabled is true
  3. voice_preference stores the voice name that matches browser TTS API
*/

-- Add voice preference columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'voice_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN voice_preference text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'voice_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN voice_enabled boolean DEFAULT true;
  END IF;
END $$;
