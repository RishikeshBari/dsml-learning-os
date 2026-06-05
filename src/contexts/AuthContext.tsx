import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { ClassSchedule, Profile, UserSettings } from '../types/database';

type BootstrapState = 'idle' | 'loading' | 'ready' | 'error';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  classSchedule: ClassSchedule[];
  loading: boolean;
  bootstrapState: BootstrapState;
  authError: string | null;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshBootstrapData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshBootstrapData = useCallback(async () => {
    if (!supabase) {
      setBootstrapState('error');
      setAuthError('Supabase environment variables are missing.');
      return;
    }

    const currentUser = session?.user;

    if (!currentUser) {
      setProfile(null);
      setSettings(null);
      setClassSchedule([]);
      setBootstrapState('idle');
      return;
    }

    setBootstrapState('loading');
    setAuthError(null);

    const [{ data: profileData, error: profileError }, { data: settingsData, error: settingsError }, { data: scheduleData, error: scheduleError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
      supabase.from('user_settings').select('*').eq('user_id', currentUser.id).single(),
      supabase.from('class_schedule').select('*').eq('user_id', currentUser.id).eq('is_active', true).order('weekday'),
    ]);

    const error = profileError || settingsError || scheduleError;

    if (error) {
      setBootstrapState('error');
      setAuthError(error.message);
      return;
    }

    setProfile(profileData);
    setSettings(settingsData);
    setClassSchedule(scheduleData ?? []);
    setBootstrapState('ready');
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setAuthError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.');
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshBootstrapData();
  }, [refreshBootstrapData]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      return { error: { name: 'MissingSupabaseConfig', message: 'Supabase is not configured.' } as AuthError };
    }

    setAuthError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setAuthError(error.message);
    }

    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setSettings(null);
    setClassSchedule([]);
    setBootstrapState('idle');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      settings,
      classSchedule,
      loading,
      bootstrapState,
      authError,
      isConfigured: hasSupabaseConfig,
      signInWithGoogle,
      signOut,
      refreshBootstrapData,
    }),
    [authError, bootstrapState, classSchedule, loading, profile, refreshBootstrapData, session, settings, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
