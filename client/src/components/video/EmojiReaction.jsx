import React, { useEffect, useState } from 'react';
import useMeetingStore from '../../store/useMeetingStore';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '👏', '🔥', '🎊'];

const EmojiReaction = () => {
  const reactions = useMeetingStore((s) => s.reactions);

  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute text-3xl sm:text-4xl animate-[slideUp_0.8s_ease-out_forwards]"
          style={{
            left: `${15 + Math.random() * 70}%`,
            bottom: '20%',
            animation: `floatUp 2s ease-out forwards`,
          }}
        >
          {r.emoji}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-200px) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default EmojiReaction;
