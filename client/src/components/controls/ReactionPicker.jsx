import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '👏', '🔥', '🎊'];

const ReactionPicker = ({ onReact }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Send reaction"
        className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/8 hover:bg-white/14 text-white transition-all duration-200 active:scale-95"
      >
        <Smile size={18} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border-2 rounded-xl p-2 shadow-2xl flex gap-1 animate-[fadeIn_0.15s_ease-out]">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onReact(emoji); setOpen(false); }}
              className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-all hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
