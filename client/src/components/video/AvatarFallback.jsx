import React from 'react';

// 8 deterministic colors for avatar backgrounds
const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-pink-600',
  'bg-indigo-600',
];

/**
 * Hash a string to a stable index in [0, AVATAR_COLORS.length)
 */
const hashName = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % AVATAR_COLORS.length;
};

/**
 * Extract up to 2 initials from a display name.
 * "John Doe" → "JD", "Alice" → "A", "  Bob  " → "B"
 */
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
    <div className="w-full h-full flex items-center justify-center bg-[#111118]">
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
