import React from 'react';

export type BadgeVariant = 'success' | 'pending' | 'in-review' | 'rejected' | 'running' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  'in-review': 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  running: 'bg-green-100 text-green-700',
  default: 'bg-gray-100 text-gray-600',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
