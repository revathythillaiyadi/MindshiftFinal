/*
  # Create Journal Entries Table

  1. New Tables
    - `journal_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `entry_date` (date) - The date of the journal entry
      - `content` (text) - The journal entry content
      - `title` (text) - Optional title for the entry
      - `created_at` (timestamptz) - When the entry was created
      - `updated_at` (timestamptz) - When the entry was last updated

  2. Security
    - Enable RLS on `journal_entries` table
    - Add policy for users to read their own journal entries
    - Add policy for users to insert their own journal entries
    - Add policy for users to update their own journal entries
    - Add policy for users to delete their own journal entries

  3. Indexes
    - Add index on user_id and entry_date for fast lookups
    - Add unique constraint on user_id and entry_date (one entry per day per user)

  4. Important Notes
    - This table is separate from chat_sessions and chat_messages
    - Journal entries are standalone and don't include assistant responses
    - Each user can have one journal entry per day
*/

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL,
  content text DEFAULT '',
  title text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date 
  ON journal_entries(user_id, entry_date DESC);