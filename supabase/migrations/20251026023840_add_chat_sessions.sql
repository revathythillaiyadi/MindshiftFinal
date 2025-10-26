/*
  # Add Chat Sessions Support

  ## Overview
  Adds support for multiple chat sessions, allowing users to organize conversations
  into separate threads with titles and manage their chat history.

  ## New Tables

  ### chat_sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text) - Session title (defaults to first message preview)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Changes to Existing Tables

  ### chat_messages
  - Add `session_id` (uuid, references chat_sessions) - Links messages to sessions
  - Make nullable initially for backward compatibility

  ## Security
  - Enable RLS on chat_sessions table
  - Users can only access their own chat sessions
  - Policies enforce ownership checks for all operations

  ## Important Notes
  1. Existing messages without session_id will be migrated to a default session
  2. Each user will have their messages grouped into a default session
  3. New chats will automatically create new sessions
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add session_id column to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- Migrate existing messages to default sessions
DO $$
DECLARE
  user_record RECORD;
  default_session_id uuid;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM chat_messages WHERE session_id IS NULL
  LOOP
    INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
    VALUES (user_record.user_id, 'Chat History', now(), now())
    RETURNING id INTO default_session_id;
    
    UPDATE chat_messages
    SET session_id = default_session_id
    WHERE user_id = user_record.user_id AND session_id IS NULL;
  END LOOP;
END $$;
