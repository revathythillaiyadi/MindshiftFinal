import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  reframed_content: string | null;
  created_at: string;
};

export type MoodLog = {
  id: string;
  user_id: string;
  mood_value: number;
  mood_label: string;
  notes: string | null;
  created_at: string;
};

export type Achievement = {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
