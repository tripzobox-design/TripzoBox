import React from 'react';
import { User } from '../../types';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm bg-accent/40 text-primary-dark font-semibold select-none ${sizeMap[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'sm',
  className = '',
}) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visible.map((u) => (
        <Avatar key={u.id} src={u.avatarUrl} name={u.name} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={`relative inline-flex items-center justify-center rounded-full bg-light-bg text-text font-medium border-2 border-white text-xs ${
            size === 'sm' ? 'w-8 h-8' : size === 'xs' ? 'w-6 h-6 text-[10px]' : 'w-10 h-10'
          }`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
