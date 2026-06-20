import React from 'react';

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage = ({ message, isOwn = false }) => {
  const { senderName, text, timestamp } = message;

  return (
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-[11px] font-semibold text-text-3 truncate max-w-[120px]">
          {isOwn ? 'You' : senderName}
        </span>
        <span className="text-[10px] text-text-4">{formatTime(timestamp)}</span>
      </div>

      <div
        className={`
          max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
          ${isOwn
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-white/[0.06] text-text-2 rounded-tl-sm'
          }
        `}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;
