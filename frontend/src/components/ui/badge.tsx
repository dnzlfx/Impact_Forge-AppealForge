import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'accent';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-deep text-white',
  secondary: 'border-transparent bg-subtle text-deep',
  outline: 'border-border text-mid bg-card',
  success: 'border-transparent bg-success-bg text-success font-semibold',
  warning: 'border-transparent bg-amber-subtle text-amber font-semibold',
  destructive: 'border-transparent bg-flag-bg text-flag-red font-semibold',
  accent: 'border-transparent bg-accent-subtle text-accent font-semibold',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-0.5 font-mono text-[11px] font-medium leading-none tracking-tight ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
