import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, create a demo user
    if (!supabase) {
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@mindshift.app',
        user_metadata: { display_name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        identities: []
      } as User;
      
      const demoProfile = {
        id: 'demo-user-id',
        email: 'demo@mindshift.app',
        display_name: 'Demo User',
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        voice_preference: null,
        voice_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;
      
      setUser(demoUser);
      setProfile(demoProfile);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (() => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!data) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        });

        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        setProfile(newProfile);
      }
    } else {
      setProfile(data);
    }

    setLoading(false);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!supabase) {
      // Demo mode - simulate successful signup
      const demoUser = {
        id: 'demo-user-id',
        email: email,
        user_metadata: { display_name: displayName },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        identities: []
      } as User;
      
      const demoProfile = {
        id: 'demo-user-id',
        email: email,
        display_name: displayName,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        voice_preference: null,
        voice_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;
      
      setUser(demoUser);
      setProfile(demoProfile);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) throw error;

    if (data.user && data.user.identities && data.user.identities.length > 0) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        display_name: displayName,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      // Demo mode - simulate successful signin
      const demoUser = {
        id: 'demo-user-id',
        email: email,
        user_metadata: { display_name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        identities: []
      } as User;
      
      const demoProfile = {
        id: 'demo-user-id',
        email: email,
        display_name: 'Demo User',
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        voice_preference: null,
        voice_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;
      
      setUser(demoUser);
      setProfile(demoProfile);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }
  };

  const signOut = async () => {
    if (!supabase) {
      // Demo mode - clear user data
      setUser(null);
      setProfile(null);
      return;
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
