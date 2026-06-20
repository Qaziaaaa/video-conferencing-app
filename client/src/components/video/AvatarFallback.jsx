import React from 'react';

const AVATAR_COLORS = [
  'bg-accent',
  'bg-[#8b5cf6]',
  'bg-success',
  'bg-[#f43f5e]',
  'bg-warning',
  'bg-[#06b6d4]',
  'bg-[#ec4899]',
  'bg-accent',
];

const hashName = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % AVATAR_COLORS.length;
};

const getInitials = (displayName) => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AvatarFallback = ({ displayName = '', size = 'md' }) => {
  const initials = getInitials(displayName);
  const colorClass = AVATAR_COLORS[hashName(displayName)];

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
    full: 'w-full h-full text-4xl',
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-surface">
      <div
        className={`${colorClass} ${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center font-bold text-white select-none shadow-lg`}
      >
        {initials}
      </div>
    </div>
  );
};

export { getInitials, hashName };
export default AvatarFallback;
