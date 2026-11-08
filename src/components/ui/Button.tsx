import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-full tracking-wide';

  const sizeStyles = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base font-semibold',
  };

  const variantStyles = {
    primary: 'bg-brand-slate text-white hover:bg-slate-800 focus:ring-brand-slate shadow-md hover:shadow-lg',
    secondary: 'bg-stone-100 text-brand-slate hover:bg-stone-200 focus:ring-stone-300',
    outline: 'border border-slate-300 text-brand-slate hover:bg-slate-50 focus:ring-slate-400',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-300',
    gold: 'bg-brand-gold text-white hover:bg-brand-goldHover focus:ring-brand-gold shadow-gold-glow hover:shadow-lg transform hover:-translate-y-0.5',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
