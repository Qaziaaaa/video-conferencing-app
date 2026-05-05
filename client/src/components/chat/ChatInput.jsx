import React, { useState } from 'react';
import { Send } from 'lucide-react';

const MAX_LENGTH = 1000;

const ChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(`Message too long (${val.length}/${MAX_LENGTH})`);
    } else {
      setError('');
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) {
      setError(`Message too long (${trimmed.length}/${MAX_LENGTH})`);
      return;
    }
    onSend(trimmed);
    setText('');
    setError('');
  };

  const remaining = MAX_LENGTH - text.length;
  const isOverLimit = text.length > MAX_LENGTH;

  return (
    <div className="flex flex-col gap-1 p-3 border-t border-white/5">
      {error && (
        <p className="text-[11px] text-red-400 px-1">{error}</p>
      )}

      <div className={`flex items-end gap-2 bg-white/5 rounded-xl border transition-colors ${isOverLimit ? 'border-red-500/50' : 'border-white/10 focus-within:border-blue-500/50'}`}>
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message… (Enter to send)"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none max-h-24 overflow-y-auto"
          style={{ minHeight: '40px' }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || isOverLimit || disabled}
          aria-label="Send message"
          className="flex-shrink-0 mb-1.5 mr-1.5 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>

      {text.length > MAX_LENGTH * 0.8 && (
        <p className={`text-[10px] text-right px-1 ${isOverLimit ? 'text-red-400' : 'text-slate-500'}`}>
          {remaining} remaining
        </p>
      )}
    </div>
  );
};

export default ChatInput;
