import React from 'react';
import { cn } from '@/lib/utils';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    "font-pixel relative transition-all duration-100",
    "border-4 pixel-shadow",
    "active:translate-x-1 active:translate-y-1 active:shadow-none",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[4px_4px_0px_0px_hsl(var(--pixel-green-dark))]",
  );

  const variantClasses = {
    primary: "bg-primary text-primary-foreground border-primary hover:brightness-110",
    secondary: "bg-secondary text-secondary-foreground border-secondary hover:brightness-110",
    ghost: "bg-transparent text-foreground border-transparent hover:bg-muted",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-[8px]",
    md: "px-4 py-2 text-[10px]",
    lg: "px-6 py-3 text-xs",
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelButton;
