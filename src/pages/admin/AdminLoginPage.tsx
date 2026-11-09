import React, { useEffect, useRef, useState } from 'react';
import { LogoMark } from '../../components/brand/Logo';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth, type AdminStep, type AuthenticatorSetup } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, ArrowLeft, KeyRound, Smartphone, AlertCircle } from 'lucide-react';

type Step = 'credentials' | 'code' | 'setup';

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { showSuccess } = useToast();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<AuthenticatorSetup | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumeChecked = useRef(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin/dashboard';

  const applyStep = async (result: AdminStep) => {
    if (result.status === 'signed-in') {
      showSuccess('Signed in', 'Welcome to the IvStay admin console');
      navigate(from, { replace: true });
      return;
    }
    if (result.status === 'error') {
      setError(result.message);
      return;
    }
    setError(null);
    setCode('');
    if (result.status === 'needs-code') {
      setStep('code');
      return;
    }
    setStep('setup');
    try {
      setSetup(await auth.startAuthenticatorSetup());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the authenticator setup.');
    }
  };

  const run = async (action: () => Promise<AdminStep>) => {
    setBusy(true);
    setError(null);
    try {
      await applyStep(await action());
    } finally {
      setBusy(false);
    }
  };

  // A password sign-in may already have happened (for example the page was reloaded during the
  // code step). Pick up where it left off, once, after the saved session has been restored.
  useEffect(() => {
    if (auth.mode !== 'supabase' || auth.loading || resumeChecked.current) return;
    resumeChecked.current = true;
    if (auth.user && !auth.isAdmin) {
      void run(auth.resumeAdminSignIn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.mode, auth.loading]);

  if (auth.isAdmin && step === 'credentials') {
    return <Navigate to={from} replace />;
  }

  const switchAccount = async () => {
    await auth.logout();
    setStep('credentials');
    setSetup(null);
    setCode('');
    setPassword('');
    setError(null);
  };

  const codeInput = (
    <div>
      <label htmlFor="admin-code" className="block text-xs font-bold text-slate-300 mb-1">
        6-digit code
      </label>
      <div className="relative">
        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        <input
          id="admin-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className={`${inputClass} tracking-[0.3em] font-mono`}
          required
          autoFocus
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-gold text-white rounded-2xl flex items-center justify-center font-serif font-bold text-2xl mx-auto shadow-gold-glow">
            <LogoMark size={30} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight">IvStay Admin Portal</h1>
          <p className="text-xs text-slate-400">
            {step === 'credentials' && 'Sign in with your admin account'}
            {step === 'code' && 'Two-step verification'}
            {step === 'setup' && 'Set up two-step verification'}
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {auth.mode === 'unconfigured' && (
          <p className="text-xs text-slate-300 leading-relaxed">
            Admin sign-in isn't set up on this site yet. Add <code className="text-brand-gold">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-brand-gold">VITE_SUPABASE_PUBLISHABLE_KEY</code> to the site's environment and rebuild it.
          </p>
        )}

        {import.meta.env.DEV && auth.mode === 'dev-local' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Supabase isn't configured, so this development server lets you in as a local admin. To use real
              admin accounts, copy <code className="text-brand-gold">.env.example</code> to{' '}
              <code className="text-brand-gold">.env.local</code> and fill it in (see README).
            </p>
            <Button
              type="button"
              variant="gold"
              className="w-full py-3.5 font-bold shadow-gold-glow text-xs"
              onClick={() => {
                auth.devSignIn();
                navigate(from, { replace: true });
              }}
            >
              Continue as local admin (dev only)
            </Button>
          </div>
        )}

        {auth.mode === 'supabase' && step === 'credentials' && (
          <form onSubmit={(e) => { e.preventDefault(); void run(() => auth.signInAdmin(email, password)); }} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-300 mb-1">Admin email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Admin email address"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <Button type="submit" variant="gold" isLoading={busy || auth.loading} className="w-full py-3.5 font-bold shadow-gold-glow text-xs">
              Sign in
            </Button>
          </form>
        )}

        {auth.mode === 'supabase' && step === 'code' && (
          <form onSubmit={(e) => { e.preventDefault(); void run(() => auth.verifyCode(code)); }} className="space-y-4">
            <p className="text-xs text-slate-300">Open your authenticator app and enter the code shown for IvStay.</p>
            {codeInput}
            <Button type="submit" variant="gold" isLoading={busy} disabled={code.length !== 6} className="w-full py-3.5 font-bold shadow-gold-glow text-xs">
              Verify
            </Button>
          </form>
        )}

        {auth.mode === 'supabase' && step === 'setup' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (setup) void run(() => auth.finishAuthenticatorSetup(setup.factorId, code));
            }}
            className="space-y-4"
          >
            <div className="flex items-start gap-2 text-xs text-slate-300">
              <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-brand-gold" />
              <p>
                Admin accounts need a second step. Scan this QR code with an authenticator app (Google Authenticator,
                Microsoft Authenticator, 1Password…), then enter the code it shows.
              </p>
            </div>
            {setup ? (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-3 w-48 h-48 mx-auto">
                  <img src={setup.qrCode} alt="QR code for your authenticator app" className="w-full h-full" />
                </div>
                <div className="text-[11px] text-slate-400 text-center">
                  Can't scan? Enter this key in the app instead:
                  <code data-testid="totp-secret" className="block mt-1 text-brand-gold font-mono break-all select-all">
                    {setup.secret}
                  </code>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Preparing your QR code…</p>
            )}
            {codeInput}
            <Button type="submit" variant="gold" isLoading={busy} disabled={!setup || code.length !== 6} className="w-full py-3.5 font-bold shadow-gold-glow text-xs">
              Verify and finish
            </Button>
          </form>
        )}

        {/* Footer links */}
        <div className="text-center pt-2 space-y-2">
          {auth.mode === 'supabase' && step !== 'credentials' && (
            <button
              type="button"
              onClick={() => void switchAccount()}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Use a different account
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-gold" />
            <span>Return to the public site</span>
          </button>
        </div>
      </div>
    </div>
  );
};
