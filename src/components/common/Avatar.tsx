import React from 'react';

interface AvatarProps {
  name: string;
  initials?: string;
  picture?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  initials,
  picture,
  size = 'md',
  className = '',
  showStatus = false,
  isOnline = false
}) => {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (fullName: string) => {
    if (initials) return initials;
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-10 h-10 text-sm font-semibold'
  };

  const statusSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <div className="relative inline-flex shrink-0">
      {picture && !imageError ? (
        <img
          src={picture}
          alt={name}
          title={name}
          onError={() => setImageError(true)}
          className={`rounded-full object-cover border border-[var(--color-primary-border)] ${sizeClasses[size]} ${className}`}
        />
      ) : (
        <div
          title={name}
          className={`flex items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary-border)] select-none ${sizeClasses[size]} ${className}`}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-[var(--color-bg-card)] ${
            isOnline ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-subtle)]'
          } ${statusSize[size]}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
