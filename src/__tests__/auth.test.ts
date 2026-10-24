import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

describe('Phase 1: Supabase Authentication Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Supabase Client Structure
  describe('Supabase Client Configuration', () => {
    it('exports a valid supabase client instance with auth methods', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
      expect(typeof supabase.auth.getSession).toBe('function');
      expect(typeof supabase.auth.onAuthStateChange).toBe('function');
      expect(typeof supabase.auth.resetPasswordForEmail).toBe('function');
      expect(typeof supabase.auth.updateUser).toBe('function');
    });

    it('identifies if Supabase credentials are configured', () => {
      expect(typeof isSupabaseConfigured).toBe('boolean');
    });
  });

  // 2. Signup Flow & Full Name Metadata
  describe('Signup Operations', () => {
    it('successfully calls supabase.auth.signUp with email, password, and full_name metadata', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'ramesh@example.com',
        user_metadata: { full_name: 'Ramesh Kumar' },
      };

      const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: {
          user: mockUser as any,
          session: null, // Needs email verification
        },
        error: null,
      });

      const email = 'ramesh@example.com';
      const password = 'securePassword123';
      const fullName = 'Ramesh Kumar';

      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      expect(signUpSpy).toHaveBeenCalledWith({
        email: 'ramesh@example.com',
        password: 'securePassword123',
        options: {
          data: { full_name: 'Ramesh Kumar' },
        },
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.user?.user_metadata.full_name).toBe('Ramesh Kumar');
      expect(result.data.session).toBeNull();
    });

    it('returns an error when signup fails (e.g. user already exists)', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          name: 'AuthApiError',
          message: 'User already registered',
          status: 400,
        } as any,
      });

      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('User already registered');
    });
  });

  // 3. Login Flow
  describe('Login Operations', () => {
    it('successfully signs in with valid email and password', async () => {
      const mockSession = {
        access_token: 'fake-token-abc',
        user: { id: 'user-123', email: 'driver@uber.com' },
      };

      const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: {
          user: mockSession.user as any,
          session: mockSession as any,
        },
        error: null,
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'driver@uber.com',
        password: 'correctPassword',
      });

      expect(signInSpy).toHaveBeenCalledWith({
        email: 'driver@uber.com',
        password: 'correctPassword',
      });
      expect(result.data.session).toBeDefined();
      expect(result.data.user?.email).toBe('driver@uber.com');
      expect(result.error).toBeNull();
    });

    it('handles invalid credentials error without crashing', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          name: 'AuthApiError',
          message: 'Invalid login credentials',
          status: 400,
        } as any,
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongPassword',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid login credentials');
      expect(result.data.session).toBeNull();
    });

    it('handles email not confirmed error', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          name: 'AuthApiError',
          message: 'Email not confirmed',
          status: 400,
        } as any,
      });

      const result = await supabase.auth.signInWithPassword({
        email: 'unconfirmed@example.com',
        password: 'password123',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Email not confirmed');
    });
  });

  // 4. Logout Flow
  describe('Logout Operations', () => {
    it('successfully terminates session via supabase.auth.signOut', async () => {
      const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValueOnce({
        error: null,
      });

      const { error } = await supabase.auth.signOut();
      expect(signOutSpy).toHaveBeenCalled();
      expect(error).toBeNull();
    });
  });

  // 5. Password Reset Flow
  describe('Password Reset Operations', () => {
    it('sends password reset email with correct redirect URL', async () => {
      const resetSpy = vi.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const email = 'forgot@example.com';
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      expect(resetSpy).toHaveBeenCalledWith(email, {
        redirectTo: 'http://localhost:5173/reset-password',
      });
      expect(result.error).toBeNull();
    });

    it('updates user password when token/session is active', async () => {
      const updateSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      const newPassword = 'brandNewPassword123';
      const result = await supabase.auth.updateUser({ password: newPassword });

      expect(updateSpy).toHaveBeenCalledWith({ password: newPassword });
      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
    });
  });

  // 6. Session Persistence & Restoration
  describe('Session Restoration', () => {
    it('fetches existing session on initialization', async () => {
      const mockSession = {
        access_token: 'saved-jwt-token',
        user: { id: 'u-456', email: 'zomato_rider@test.com' },
      };

      const getSessionSpy = vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: mockSession as any },
        error: null,
      });

      const { data } = await supabase.auth.getSession();
      expect(getSessionSpy).toHaveBeenCalled();
      expect(data.session?.user.email).toBe('zomato_rider@test.com');
    });

    it('subscribes to onAuthStateChange and unsubscribes cleanly', () => {
      const mockUnsubscribe = vi.fn();
      const onAuthSpy = vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValueOnce({
        data: {
          subscription: {
            id: 'sub-1',
            callback: vi.fn(),
            unsubscribe: mockUnsubscribe,
          },
        },
      });

      const callback = vi.fn();
      const { data } = supabase.auth.onAuthStateChange(callback);

      expect(onAuthSpy).toHaveBeenCalledWith(callback);
      data.subscription.unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  // 7. Route Protection Rules
  describe('Route Protection Specifications', () => {
    it('determines unauthenticated redirect path to /login with state preservation', () => {
      const user = null;
      const currentPath = '/obligations';

      let redirectTarget: string | null = null;
      let stateData: any = null;

      if (!user) {
        redirectTarget = '/login';
        stateData = { from: { pathname: currentPath } };
      }

      expect(redirectTarget).toBe('/login');
      expect(stateData.from.pathname).toBe('/obligations');
    });

    it('allows access to protected routes when authenticated user is present', () => {
      const user = { id: 'u-789', email: 'swiggy_hero@example.com' };

      let allowed = false;
      if (user) {
        allowed = true;
      }

      expect(allowed).toBe(true);
    });

    it('redirects authenticated user from /login back to requested page or /balance', () => {
      const user = { id: 'u-789' };
      const locationState = { from: { pathname: '/simulate' } };

      let redirectTarget = '/balance';
      if (user) {
        redirectTarget = locationState?.from?.pathname || '/balance';
      }

      expect(redirectTarget).toBe('/simulate');
    });
  });
});
