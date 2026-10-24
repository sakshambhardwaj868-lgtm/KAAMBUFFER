import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: AuthError | Error | null;
  needsEmailVerification?: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<AuthResponse>;
  updatePassword: (newPassword: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    // 1. Restore existing session on initial application load
    supabase.auth.getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (!error && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Listen to active auth state changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession ? newSession.user : null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase authentication is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        },
      });

      if (error) {
        return { data: null, error };
      }

      // If user was created but session is null, Supabase requires email verification
      const needsEmailVerification = Boolean(data.user && !data.session);

      return {
        data,
        error: null,
        needsEmailVerification,
      };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Signup failed. Please try again.'),
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase authentication is not configured. Please check .env.local credentials.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { data: null, error };
      }

      setSession(data.session);
      setUser(data.user);

      return { data, error: null };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Login failed. Please try again.'),
      };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | Error | null }> => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { error };
    } catch (err: unknown) {
      setUser(null);
      setSession(null);
      return {
        error: err instanceof Error ? err : new Error('Logout encountered an error.'),
      };
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase authentication is not configured.'),
      };
    }

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      return { data, error };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Password reset request failed.'),
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase authentication is not configured.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { data, error };
    } catch (err: unknown) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to update password.'),
      };
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
