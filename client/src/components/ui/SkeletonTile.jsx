import React from 'react';

const SkeletonTile = () => {
  return (
    <div className="relative w-full h-full bg-surface rounded-xl overflow-hidden border border-border flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />

      <div className="flex flex-col items-center gap-3 z-10">
        <div className="w-16 h-16 rounded-full bg-white/8 animate-pulse" />
        <div className="w-24 h-3 rounded-full bg-white/8 animate-pulse" />
      </div>

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-white/8 animate-pulse" />
        <div className="w-16 h-2.5 rounded-full bg-white/8 animate-pulse" />
      </div>
    </div>
  );
};

export default SkeletonTile;
