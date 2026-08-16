import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-[4px]',
    circular: 'rounded-full',
    text: 'h-4 rounded-[3px]',
  };

  return (
    <div
      className={`animate-pulse bg-subtle/80 ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
