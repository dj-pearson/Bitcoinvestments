import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary:
    'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm',
  secondary:
    'bg-white/10 hover:bg-white/20 text-white border border-white/10',
  ghost:
    'hover:bg-white/10 text-gray-300',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
} as const;

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md min-h-[36px]',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg min-h-[44px]',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-lg min-h-[48px]',
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  }
);
