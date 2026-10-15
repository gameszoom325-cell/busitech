import React from 'react';

export type ChipVariant =
  | 'critical'
  | 'danger'
  | 'warning'
  | 'upcoming'
  | 'info'
  | 'success'
  | 'neutral'
  | 'review'
  | 'count'
  | 'time';

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  dot?: boolean;
  dotColor?: 'red' | 'amber' | 'green' | 'blue';
  icon?: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm';
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'neutral',
  dot = false,
  dotColor,
  icon,
  className = '',
  size = 'xs'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
      case 'danger':
      case 'review':
        return 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]';
      case 'warning':
        return 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]';
      case 'upcoming':
      case 'info':
        return 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info-border)]';
      case 'success':
        return 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]';
      case 'count':
      case 'time':
        return 'bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border-[var(--color-primary-border)]';
      case 'neutral':
      default:
        return 'bg-[var(--color-neutral-chip-bg)] text-[var(--color-neutral-chip-text)] border-[var(--color-neutral-chip-border)]';
    }
  };

  const getDotClass = () => {
    if (!dot) return '';
    if (dotColor === 'red') return 'bg-[var(--color-danger)]';
    if (dotColor === 'amber') return 'bg-[var(--color-warning)]';
    if (dotColor === 'green') return 'bg-[var(--color-success)]';
    if (dotColor === 'blue') return 'bg-[var(--color-primary)]';
    return 'bg-current';
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px] tracking-wide font-semibold'
      : 'px-2.5 py-1 text-xs tracking-wide font-semibold';

  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase transition-colors whitespace-nowrap shrink-0 max-w-full select-none ${getVariantStyles()} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotClass()}`} />}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
};
