import React from 'react';
import { createPortal } from 'react-dom';
import useMeetingStore from '../../store/useMeetingStore';

const EmojiReaction = () => {
  const reactions = useMeetingStore((s) => s.reactions);

  if (reactions.length === 0) return null;

  // Portal to document.body so we're outside all video stacking contexts
  return createPortal(
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute text-3xl sm:text-4xl"
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
    </div>,
    document.body
  );
};

export default EmojiReaction;
