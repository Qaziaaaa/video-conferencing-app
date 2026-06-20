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
    <div className="flex flex-col gap-1 p-3 border-t border-border">
      {error && (
        <p className="text-[11px] text-danger px-1">{error}</p>
      )}

      <div className={`flex items-end gap-2 bg-white/[0.03] rounded-xl border transition-colors duration-200 ${isOverLimit ? 'border-danger/50' : 'border-border focus-within:border-accent/50'}`}>
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message… (Enter to send)"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-text-4 outline-none resize-none max-h-24 overflow-y-auto"
          style={{ minHeight: '40px' }}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || isOverLimit || disabled}
          aria-label="Send message"
          className="flex-shrink-0 mb-1.5 mr-1.5 w-8 h-8 flex items-center justify-center bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>

      {text.length > MAX_LENGTH * 0.8 && (
        <p className={`text-[10px] text-right px-1 ${isOverLimit ? 'text-danger' : 'text-text-4'}`}>
          {remaining} remaining
        </p>
      )}
    </div>
  );
};

export default ChatInput;
