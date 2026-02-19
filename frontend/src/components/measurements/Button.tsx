'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-nestup font-medium transition-all duration-200 active:scale-95';

  const variantStyles = {
    primary: 'bg-nestup-accent text-white hover:bg-nestup-accent-dark hover:shadow-nestup-lg',
    secondary: 'bg-white text-nestup-charcoal border-2 border-nestup-sand hover:border-nestup-accent hover:shadow-nestup',
    tertiary: 'bg-transparent text-nestup-charcoal-light hover:text-nestup-charcoal underline',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
