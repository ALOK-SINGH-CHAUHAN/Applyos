import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showValue?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

function getBarColor(value: number): string {
  if (value >= 80) return 'bg-danger';
  if (value >= 60) return 'bg-warning';
  return 'bg-accent';
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  className = '',
  size = 'sm',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-xs font-medium text-secondary">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-primary ml-auto">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-app-border rounded-full ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${getBarColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
