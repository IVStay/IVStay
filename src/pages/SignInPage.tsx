import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { useAuth, MIN_PASSWORD_LENGTH, type CustomerResult } from '../context/AuthContext';
import { isValidPhone, PHONE_ERROR, PHONE_REQUIRED } from '../lib/phone';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Button } from '../components/ui/Button';

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

const field =
  'w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate';
const label = 'block text-xs font-semibold text-slate-600 mb-1.5';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/** Only same-site paths are allowed as the place to return to after signing in. */
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/account');

export const SignInPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!auth.loading && auth.user && mode !== 'reset') {
    return <Navigate to={next} replace />;
  }

  const go = (to: Mode) => {
    setMode(to);
    setError(null);
    setNotice(null);
    setCode('');
  };

  const run = async (action: () => Promise<CustomerResult>, onOk: (r: CustomerResult & { ok: true }) => void) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(false);
    if (result.ok) onOk(result);
    else setError(result.message);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'signin') {
      void run(() => auth.signInCustomer(email, password), () => navigate(next, { replace: true }));
    } else if (mode === 'signup') {
      if (fullName.trim().length < 2) return setError('Please enter your full name.');
      if (!phone) return setError(PHONE_REQUIRED);
      if (!isValidPhone(phone)) return setError(PHONE_ERROR);
      if (password.length < MIN_PASSWORD_LENGTH) {
        return setError(`Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      }
      void run(
        () => auth.signUpCustomer({ fullName, phone, email, password }),
        (result) => {
          if (result.next === 'confirm-email') {
            setMode('confirm');
            setNotice(`We sent a 6-digit code to ${email.trim()}. Enter it below to finish.`);
          } else {
            navigate(next, { replace: true });
          }
        }
      );
    } else if (mode === 'confirm') {
      void run(() => auth.confirmEmail(email, code), () => navigate(next, { replace: true }));
    } else if (mode === 'forgot') {
      void run(
        () => auth.sendPasswordReset(email),
        () => {
          setMode('reset');
          setNotice(`If ${email.trim()} has an account, a 6-digit code is on its way. Enter it with your new password.`);
        }
      );
    } else if (mode === 'reset') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return setError(`Your new password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      }
      void run(() => auth.resetPassword(email, code, password), () => navigate(next, { replace: true }));
    }
  };

  const google = () => void run(() => auth.signInWithGoogle(next), () => undefined);

  const titles: Record<Mode, [string, string]> = {
    signin: ['Welcome back', 'Sign in to see your bookings and book faster.'],
    signup: ['Create your account', 'Save your details once and track every request in one place.'],
    confirm: ['Check your email', 'Enter the code we emailed you to confirm your account.'],
    forgot: ['Reset your password', "Enter your account's email and we'll send you a code."],
    reset: ['Choose a new password', 'Enter the code from the email and your new password.'],
  };
  const [title, subtitle] = titles[mode];

  const passwordInput = (labelText: string, autoComplete: string) => (
    <div>
      <label htmlFor="password" className={label}>
        {labelText}
      </label>
      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={mode === 'signin' ? undefined : MIN_PASSWORD_LENGTH}
          className={`${field} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {mode !== 'signin' && (
        <p className="text-[11px] text-slate-400 mt-1">At least {MIN_PASSWORD_LENGTH} characters.</p>
      )}
    </div>
  );

  const codeInput = (
    <div>
      <label htmlFor="code" className={label}>
        6-digit code
      </label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
        required
        className={`${field} tracking-[0.4em] text-center font-semibold`}
        placeholder="••••••"
      />
    </div>
  );

  const emailInput = (
    <div>
      <label htmlFor="email" className={label}>
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        readOnly={mode === 'confirm' || mode === 'reset'}
        className={`${field} read-only:bg-slate-50 read-only:text-slate-500`}
      />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-90px)] bg-stone-50 flex items-start sm:items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          {(mode === 'confirm' || mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => go(mode === 'confirm' ? 'signup' : 'signin')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-slate mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <h1 className="font-serif text-2xl font-bold text-brand-slate">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <>
            <div className="grid grid-cols-2 bg-slate-100 rounded-full p-1 text-sm font-semibold" role="tablist">
              {(['signin', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => go(tab)}
                  className={`py-2 rounded-full transition-colors ${
                    mode === tab ? 'bg-white text-brand-slate shadow-sm' : 'text-slate-500 hover:text-brand-slate'
                  }`}
                >
                  {tab === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50 disabled:opacity-50"
            >
              <GoogleLogo /> Continue with Google
            </button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or with email <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        {notice && (
          <p className="flex gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <Mail className="w-4 h-4 shrink-0" /> {notice}
          </p>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="fullName" className={label}>
                  Full name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="phone" className={label}>
                  Phone number
                </label>
                <PhoneInput id="phone" value={phone} onChange={setPhone} required />
              </div>
            </>
          )}

          {emailInput}
          {(mode === 'confirm' || mode === 'reset') && codeInput}
          {mode === 'signin' && passwordInput('Password', 'current-password')}
          {mode === 'signup' && passwordInput('Create a password', 'new-password')}
          {mode === 'reset' && passwordInput('New password', 'new-password')}

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" isLoading={busy} className="w-full py-3">
            {
              {
                signin: 'Sign in',
                signup: 'Create account',
                confirm: 'Confirm email',
                forgot: 'Send code',
                reset: 'Save new password',
              }[mode]
            }
          </Button>
        </form>

        <div className="text-xs text-slate-500 text-center space-y-2">
          {mode === 'signin' && (
            <button type="button" onClick={() => go('forgot')} className="font-semibold hover:text-brand-slate">
              Forgot your password?
            </button>
          )}
          {mode === 'confirm' && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => auth.resendConfirmation(email),
                  () => setNotice(`A new code is on its way to ${email.trim()}.`)
                )
              }
              className="font-semibold hover:text-brand-slate"
            >
              Didn't get it? Send a new code
            </button>
          )}
          {mode === 'signup' && (
            <p>
              By creating an account you agree to our{' '}
              <Link to="/terms" className="font-semibold text-brand-slate hover:underline">
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold text-brand-slate hover:underline">
                Privacy Policy
              </Link>
              , and to IvStay contacting you about your bookings by phone, WhatsApp and email.
            </p>
          )}
          <p>
            <Link to="/" className="hover:text-brand-slate">
              Back to IvStay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
