import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const classNames = [styles.button, styles[variant]];
    
    if (className) {
      classNames.push(className);
    }

    return (
      <button
        ref={ref}
        className={classNames.join(' ')}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
