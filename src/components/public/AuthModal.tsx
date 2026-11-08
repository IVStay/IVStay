import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Mail, Lock, User, Sparkles, Shield, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginAsGuest, loginAsAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logging into Admin
    if (email.trim().toLowerCase() === 'arnavaggarwal3095@gmail.com') {
      const ok = loginAsAdmin(email, password);
      if (ok) {
        showSuccess('Welcome back Admin!', 'Authenticated into IvStay Admin Console');
        onClose();
        return;
      } else {
        showError('Invalid Admin Password', 'Please check credentials');
        return;
      }
    }

    // Default Guest Login
    loginAsGuest(email || 'guest@ivstay.com', fullName || 'Elena Rostova');
    showSuccess('Welcome to IvStay!', 'Signed in successfully');
    onClose();
  };

  const handleOAuth = (provider: string) => {
    loginAsGuest(`guest.${provider.toLowerCase()}@ivstay.com`, `Elena (${provider} User)`);
    showSuccess(`Authenticated via ${provider}`, 'Logged in seamlessly');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Join IvStay Private Club' : 'Sign In to IvStay'}
      subtitle="Access handpicked luxury stays, saved wishlists & direct member perks"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Quick OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuth('Google')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Chrome className="w-4 h-4 text-rose-500" />
            <span>Continue with Google</span>
          </button>
          <button
            onClick={() => handleOAuth('Apple')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            Or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="arnavaggarwal3095@gmail.com or guest@ivstay.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                required
              />
            </div>
          </div>

          <Button type="submit" variant="gold" className="w-full py-3">
            {isRegister ? 'Create Luxury Account' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Demo Pre-fill Button */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span>Test Admin Direct Fill:</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Click to fill default admin credentials (<code className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded">arnavaggarwal3095@gmail.com</code> / <code className="font-mono text-[10px] bg-amber-100 px-1 py-0.5 rounded">Ambience2026</code>)
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail('arnavaggarwal3095@gmail.com');
              setPassword('Ambience2026');
            }}
            className="mt-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-semibold hover:bg-amber-700 transition-colors"
          >
            Auto-fill Admin Pass
          </button>
        </div>

        {/* Footer switch */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="font-bold text-brand-slate hover:underline ml-1"
          >
            {isRegister ? 'Sign In' : 'Register Now'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
