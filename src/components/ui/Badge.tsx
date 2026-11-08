import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface BadgeProps {
  variant?: 'verified' | 'featured' | 'villa' | 'hotel' | 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  if (variant === 'verified') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-sm backdrop-blur-md ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
        <span>IvStay Verified</span>
      </span>
    );
  }

  if (variant === 'featured') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm ${className}`}>
        <Sparkles className="w-3 h-3 text-brand-gold" />
        <span>Curated Collection</span>
      </span>
    );
  }

  const styles = {
    villa: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    hotel: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    info: 'bg-sky-100 text-sky-800 border-sky-300',
    danger: 'bg-rose-100 text-rose-800 border-rose-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
