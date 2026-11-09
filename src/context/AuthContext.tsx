import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { isValidPhone, normalizePhone, PHONE_ERROR } from '../lib/phone';

/**
 * How admin sign-in works on this build:
 * - 'supabase':     real accounts. Email + password, then a code from an authenticator app.
 * - 'dev-local':    no Supabase settings and running on the dev server. A button lets you in as a
 *                   local admin so the console stays usable; this path is never in production builds.
 * - 'unconfigured': a production build without Supabase settings. Admin sign-in is switched off.
 */
export type AuthMode = 'supabase' | 'dev-local' | 'unconfigured';

/** What the admin sign-in flow should do next. */
export type AdminStep =
  | { status: 'signed-in' }
  | { status: 'needs-code' } // has an authenticator app: ask for the 6-digit code
  | { status: 'needs-setup' } // no authenticator app yet: set one up first
  | { status: 'error'; message: string };

export interface AuthenticatorSetup {
  factorId: string;
  /** QR code as an image data URL */
  qrCode: string;
  /** The same key as text, for typing into the app by hand */
  secret: string;
}

interface Profile {
  full_name: string;
  phone: string | null;
  role: UserRole;
}

/** Result of a customer sign-in / sign-up step */
export type CustomerResult =
  | { ok: true; next?: 'confirm-email' }
  | { ok: false; message: string };

export interface CustomerSignUp {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export const MIN_PASSWORD_LENGTH = 12;

/** Turns Supabase auth errors into sentences a guest can act on. */
function customerError(error: { message: string; code?: string; name?: string }): CustomerResult {
  const text = error.message || '';
  if (error.name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(text)) {
    return { ok: false, message: "Can't reach IvStay right now. Check your internet connection and try again." };
  }
  if (error.code === 'invalid_credentials' || /invalid login credentials/i.test(text)) {
    return { ok: false, message: 'Wrong email or password.' };
  }
  if (error.code === 'email_not_confirmed' || /email not confirmed/i.test(text)) {
    return { ok: false, message: 'Please confirm your email first: enter the code we sent you.' };
  }
  if (error.code === 'user_already_exists' || /already registered/i.test(text)) {
    return { ok: false, message: 'An account with this email already exists. Sign in instead.' };
  }
  if (error.code === 'otp_expired' || /token has expired|invalid/i.test(text)) {
    return { ok: false, message: "That code didn't work or has expired. Check the latest email, or send a new code." };
  }
  if (error.code === 'over_email_send_rate_limit' || /rate limit/i.test(text)) {
    return { ok: false, message: 'Too many emails were sent just now. Please wait a few minutes and try again.' };
  }
  if (error.code === 'weak_password' || /password/i.test(text)) {
    return { ok: false, message: `Choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).` };
  }
  if (error.code === 'signup_disabled' || /signups not allowed/i.test(text)) {
    return { ok: false, message: 'New accounts are switched off at the moment. Please message us on WhatsApp.' };
  }
  return { ok: false, message: text };
}

export { isValidPhone, normalizePhone, PHONE_HINT, PHONE_ERROR } from '../lib/phone';

interface AuthContextType {
  mode: AuthMode;
  /** True while the saved session is being restored on page load */
  loading: boolean;
  user: User | null;
  isAuthenticated: boolean;
  /** Admin role AND two-step verification completed (or the dev-only local admin) */
  isAdmin: boolean;
  signInAdmin: (email: string, password: string) => Promise<AdminStep>;
  /** Works out the next step for a password sign-in that already happened (e.g. after a reload) */
  resumeAdminSignIn: () => Promise<AdminStep>;
  verifyCode: (code: string) => Promise<AdminStep>;
  startAuthenticatorSetup: () => Promise<AuthenticatorSetup>;
  finishAuthenticatorSetup: (factorId: string, code: string) => Promise<AdminStep>;
  devSignIn: () => void;
  logout: () => Promise<void>;
  // Customers
  signUpCustomer: (input: CustomerSignUp) => Promise<CustomerResult>;
  confirmEmail: (email: string, code: string) => Promise<CustomerResult>;
  resendConfirmation: (email: string) => Promise<CustomerResult>;
  signInCustomer: (email: string, password: string) => Promise<CustomerResult>;
  signInWithGoogle: (returnTo?: string) => Promise<CustomerResult>;
  sendPasswordReset: (email: string) => Promise<CustomerResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<CustomerResult>;
  updateProfile: (changes: { fullName: string; phone: string }) => Promise<CustomerResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mode: AuthMode = supabase ? 'supabase' : import.meta.env.DEV ? 'dev-local' : 'unconfigured';

const DEV_ADMIN_KEY = 'ivstay_dev_admin';
const DEV_ADMIN: User = {
  id: 'dev-local-admin',
  email: 'local admin (dev only)',
  full_name: 'Local admin',
  role: 'admin',
  created_at: new Date(0).toISOString(),
};

const readDevFlag = () => {
  try {
    return sessionStorage.getItem(DEV_ADMIN_KEY) === '1';
  } catch {
    return false;
  }
};

const notConfigured: AdminStep = { status: 'error', message: 'Admin sign-in is not set up on this site.' };
const wrongCode: AdminStep = {
  status: 'error',
  message: "That code didn't work. Codes change every 30 seconds, so enter the one showing now.",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [aal, setAal] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'supabase');
  const [devAdmin, setDevAdmin] = useState(() => mode === 'dev-local' && readDevFlag());
  const syncRun = useRef(0);
  const latestSync = useRef<Promise<void>>(Promise.resolve());

  /**
   * Reload session, profile and verification level. Only the newest call applies its results,
   * and `loading` ends only once those results are in, so pages never see a half-restored state.
   */
  const applySession = useCallback(async (next?: Session | null) => {
    if (!supabase) return;
    const run = ++syncRun.current;
    try {
      const current = next !== undefined ? next : (await supabase.auth.getSession()).data.session;

      if (!current) {
        if (run !== syncRun.current) return;
        setSession(null);
        setProfile(null);
        setAal(null);
        return;
      }

      const [{ data: row }, { data: level }] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, role').eq('id', current.user.id).maybeSingle(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (run !== syncRun.current) return;
      setSession(current);
      setProfile(
        row
          ? {
              full_name: row.full_name ?? '',
              phone: row.phone ?? null,
              role: row.role === 'admin' ? 'admin' : 'guest',
            }
          : null
      );
      setAal(level?.currentLevel ?? null);
    } finally {
      if (run === syncRun.current) setLoading(false);
    }
  }, []);

  /**
   * Like applySession, but whoever awaits it also waits for any newer reload that started
   * meanwhile (for example the one Supabase's auth event triggers right after a code is
   * verified), so the state they act on next is the final one.
   */
  const syncFromSession = useCallback(
    async (next?: Session | null) => {
      let mine = applySession(next);
      latestSync.current = mine;
      await mine;
      while (latestSync.current !== mine) {
        mine = latestSync.current;
        await mine;
      }
    },
    [applySession]
  );

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void syncFromSession();

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      // Supabase calls must not run inside this callback (it holds the auth lock), so defer them.
      setTimeout(() => {
        if (active) void syncFromSession(next);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const resumeAdminSignIn = useCallback(async (): Promise<AdminStep> => {
    if (!supabase) return notConfigured;
    const {
      data: { session: current },
    } = await supabase.auth.getSession();
    if (!current) return { status: 'error', message: 'Please sign in again.' };

    const { data: row, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', current.user.id)
      .maybeSingle();
    if (error || row?.role !== 'admin') {
      await supabase.auth.signOut({ scope: 'local' });
      await syncFromSession(null);
      return { status: 'error', message: "This account doesn't have admin access." };
    }

    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel === 'aal2') {
      await syncFromSession();
      return { status: 'signed-in' };
    }
    return level?.nextLevel === 'aal2' ? { status: 'needs-code' } : { status: 'needs-setup' };
  }, [syncFromSession]);

  const signInAdmin = useCallback(
    async (email: string, password: string): Promise<AdminStep> => {
      if (!supabase) return notConfigured;
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const wrongDetails = error.code === 'invalid_credentials' || /invalid login credentials/i.test(error.message);
        const offline = error.name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(error.message);
        const message = wrongDetails
          ? 'Wrong email or password.'
          : offline
            ? "Can't reach the sign-in service. Check your internet connection and try again."
            : error.message;
        return { status: 'error', message };
      }
      return resumeAdminSignIn();
    },
    [resumeAdminSignIn]
  );

  const verifyCode = useCallback(
    async (code: string): Promise<AdminStep> => {
      if (!supabase) return notConfigured;
      const { data, error } = await supabase.auth.mfa.listFactors();
      const factor = data?.totp.find((f) => f.status === 'verified');
      if (error || !factor) return { status: 'error', message: 'No authenticator app is set up for this account.' };

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: code.trim(),
      });
      if (verifyError) return wrongCode;
      await syncFromSession();
      return { status: 'signed-in' };
    },
    [syncFromSession]
  );

  const startAuthenticatorSetup = useCallback(async (): Promise<AuthenticatorSetup> => {
    if (!supabase) throw new Error('Admin sign-in is not set up on this site.');
    // Remove half-finished setups first, otherwise enrolling again can fail.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const factor of existing?.all ?? []) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      // Name shown in the authenticator app; without it Supabase uses the Site URL's host.
      issuer: 'IvStay',
      friendlyName: `IvStay admin ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error) throw new Error(error.message);
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  }, []);

  const finishAuthenticatorSetup = useCallback(
    async (factorId: string, code: string): Promise<AdminStep> => {
      if (!supabase) return notConfigured;
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (error) return wrongCode;
      await syncFromSession();
      return { status: 'signed-in' };
    },
    [syncFromSession]
  );

  const devSignIn = useCallback(() => {
    if (!import.meta.env.DEV || mode !== 'dev-local') return;
    try {
      sessionStorage.setItem(DEV_ADMIN_KEY, '1');
    } catch {
      /* storage unavailable: still signed in for this page view */
    }
    setDevAdmin(true);
  }, []);

  const logout = useCallback(async () => {
    if (mode === 'dev-local') {
      try {
        sessionStorage.removeItem(DEV_ADMIN_KEY);
      } catch {
        /* ignore */
      }
      setDevAdmin(false);
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut({ scope: 'local' });
    await syncFromSession(null);
  }, [syncFromSession]);

  // ---------------------------------------------------------------------------
  // Customers (role 'guest'). Email confirmation and password reset use 6-digit codes typed on
  // the site, so they work even when the email is opened on another device.
  // ---------------------------------------------------------------------------

  const notReady: CustomerResult = { ok: false, message: 'Accounts are not available on this site yet.' };

  const signUpCustomer = useCallback(
    async ({ fullName, phone, email, password }: CustomerSignUp): Promise<CustomerResult> => {
      if (!supabase) return notReady;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim(), phone: normalizePhone(phone) } },
      });
      if (error) return customerError(error);
      // Supabase hides whether an email is taken: an existing account comes back with no identities.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        return { ok: false, message: 'An account with this email already exists. Sign in instead.' };
      }
      if (data.session) {
        await syncFromSession(data.session);
        return { ok: true };
      }
      return { ok: true, next: 'confirm-email' };
    },
    [syncFromSession]
  );

  const confirmEmail = useCallback(
    async (email: string, code: string): Promise<CustomerResult> => {
      if (!supabase) return notReady;
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.replace(/\s/g, ''),
        type: 'signup',
      });
      if (error) return customerError(error);
      await syncFromSession(data.session);
      return { ok: true };
    },
    [syncFromSession]
  );

  const resendConfirmation = useCallback(async (email: string): Promise<CustomerResult> => {
    if (!supabase) return notReady;
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    return error ? customerError(error) : { ok: true };
  }, []);

  const signInCustomer = useCallback(
    async (email: string, password: string): Promise<CustomerResult> => {
      if (!supabase) return notReady;
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return customerError(error);
      await syncFromSession(data.session);
      return { ok: true };
    },
    [syncFromSession]
  );

  const signInWithGoogle = useCallback(async (returnTo = '/account'): Promise<CustomerResult> => {
    if (!supabase) return notReady;
    // Check first: with Google switched off, Supabase would show a bare error page instead.
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
      });
      const settings = (await response.json()) as { external?: { google?: boolean } };
      if (!settings.external?.google) {
        return { ok: false, message: 'Google sign-in is not switched on yet. Please use your email for now.' };
      }
    } catch {
      return customerError({ message: 'Failed to fetch', name: 'AuthRetryableFetchError' });
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${returnTo}` },
    });
    if (error) {
      return /provider is not enabled|unsupported provider/i.test(error.message)
        ? { ok: false, message: 'Google sign-in is not switched on yet. Use your email for now.' }
        : customerError(error);
    }
    return { ok: true }; // the browser is now on its way to Google
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<CustomerResult> => {
    if (!supabase) return notReady;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    return error ? customerError(error) : { ok: true };
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string): Promise<CustomerResult> => {
      if (!supabase) return notReady;
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.replace(/\s/g, ''),
        type: 'recovery',
      });
      if (error) return customerError(error);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) return customerError(updateError);
      await syncFromSession();
      return { ok: true };
    },
    [syncFromSession]
  );

  const updateProfile = useCallback(
    async ({ fullName, phone }: { fullName: string; phone: string }): Promise<CustomerResult> => {
      if (!supabase) return notReady;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { ok: false, message: 'Please sign in again.' };
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone && !isValidPhone(cleanPhone)) return { ok: false, message: PHONE_ERROR };
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: cleanPhone || null })
        .eq('id', data.session.user.id);
      if (error) return { ok: false, message: error.message };
      await syncFromSession();
      return { ok: true };
    },
    [syncFromSession]
  );

  const value = useMemo<AuthContextType>(() => {
    let user: User | null = null;
    if (mode === 'dev-local') {
      user = devAdmin ? DEV_ADMIN : null;
    } else if (session) {
      user = {
        id: session.user.id,
        email: session.user.email ?? '',
        full_name: profile?.full_name || (session.user.user_metadata?.full_name as string | undefined) || '',
        phone: profile?.phone ?? undefined,
        role: profile?.role ?? 'guest',
        avatar_url: (session.user.user_metadata?.avatar_url as string | undefined) || undefined,
        created_at: session.user.created_at,
      };
    }
    const isAdmin = mode === 'dev-local' ? devAdmin : profile?.role === 'admin' && aal === 'aal2';

    return {
      mode,
      loading,
      user,
      isAuthenticated: !!user,
      isAdmin,
      signInAdmin,
      resumeAdminSignIn,
      verifyCode,
      startAuthenticatorSetup,
      finishAuthenticatorSetup,
      devSignIn,
      logout,
      signUpCustomer,
      confirmEmail,
      resendConfirmation,
      signInCustomer,
      signInWithGoogle,
      sendPasswordReset,
      resetPassword,
      updateProfile,
    };
  }, [
    signUpCustomer,
    confirmEmail,
    resendConfirmation,
    signInCustomer,
    signInWithGoogle,
    sendPasswordReset,
    resetPassword,
    updateProfile,
    session,
    profile,
    aal,
    loading,
    devAdmin,
    signInAdmin,
    resumeAdminSignIn,
    verifyCode,
    startAuthenticatorSetup,
    finishAuthenticatorSetup,
    devSignIn,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
