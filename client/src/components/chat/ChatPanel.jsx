import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatStore from '../../store/useChatStore';
import useMeetingStore from '../../store/useMeetingStore';
import useAuthStore from '../../store/useAuthStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatPanel = ({ socket, isOpen, onClose }) => {
  const messagesEndRef = React.useRef(null);
  const { messages, clearUnread } = useChatStore();
  const { meetingId, displayName, localSocketId } = useMeetingStore();
  const { token } = useAuthStore();

  React.useEffect(() => {
    if (isOpen) {
      clearUnread();
    }
  }, [isOpen, clearUnread]);

  React.useEffect(() => {
    if (!isOpen || !meetingId || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/meetings/${meetingId}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          useChatStore.getState().setMessages(data.messages || []);
        }
      } catch {}
    };

    fetchHistory();
  }, [isOpen, meetingId, token]);

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (text) => {
    if (!socket || !meetingId) return;
    socket.emit('chat-message', {
      meetingId,
      senderName: displayName,
      text,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div
      className={`
        md:absolute md:top-0 md:right-0 md:h-full md:w-80 md:border-l md:border-border md:shadow-2xl
        fixed inset-0 z-30
        bg-surface
        flex flex-col transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-white">In-call messages</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 text-text-3 hover:text-white transition-colors duration-200"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-40">
            <MessageSquare size={28} className="text-text-4" />
            <p className="text-xs text-text-4">No messages yet.<br />Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage
              key={msg._id || i}
              message={msg}
              isOwn={msg.senderName === displayName}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0">
        <ChatInput onSend={handleSend} disabled={!socket} />
      </div>
    </div>
  );
};

export default ChatPanel;
