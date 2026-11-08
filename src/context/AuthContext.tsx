import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

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
  role: UserRole;
}

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
        supabase.from('profiles').select('full_name, role').eq('id', current.user.id).maybeSingle(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (run !== syncRun.current) return;
      setSession(current);
      setProfile(row ? { full_name: row.full_name ?? '', role: row.role === 'admin' ? 'admin' : 'guest' } : null);
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

  const value = useMemo<AuthContextType>(() => {
    let user: User | null = null;
    if (mode === 'dev-local') {
      user = devAdmin ? DEV_ADMIN : null;
    } else if (session) {
      user = {
        id: session.user.id,
        email: session.user.email ?? '',
        full_name: profile?.full_name ?? '',
        role: profile?.role ?? 'guest',
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
    };
  }, [
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
