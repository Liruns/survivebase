'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RippleStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  disableRipple?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disableRipple = false,
  onClick,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<RippleStyle[]>([]);

  const variants = {
    primary: 'bg-accent text-bg-primary hover:bg-accent-hover font-bold shadow-md shadow-accent/20 active:scale-95',
    secondary: 'bg-bg-tertiary text-text-primary hover:bg-border border border-border active:scale-95',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary active:scale-95',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded',
    md: 'px-5 py-2.5 text-sm rounded-md',
    lg: 'px-8 py-3.5 text-base rounded-lg',
  };

  const rippleColors = {
    primary: 'bg-white/30',
    secondary: 'bg-accent/20',
    ghost: 'bg-accent/20',
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple: RippleStyle = {
          left: x,
          top: y,
          width: size,
          height: size,
        };

        setRipples((prev) => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.slice(1));
        }, 600);
      }

      onClick?.(e);
    },
    [disableRipple, onClick]
  );

  return (
    <button
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      {/* Ripple effects */}
      {ripples.map((ripple, index) => (
        <span
          key={index}
          className={cn(
            'absolute rounded-full pointer-events-none animate-ripple',
            rippleColors[variant]
          )}
          style={{
            left: ripple.left,
            top: ripple.top,
            width: ripple.width,
            height: ripple.height,
          }}
        />
      ))}
    </button>
  );
}
