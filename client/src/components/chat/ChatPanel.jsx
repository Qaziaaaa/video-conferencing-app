import React, { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatStore from '../../store/useChatStore';
import useMeetingStore from '../../store/useMeetingStore';
import useAuthStore from '../../store/useAuthStore';

const SERVER_URL = 'http://localhost:5000';

const ChatPanel = ({ socket, isOpen, onClose }) => {
  const messagesEndRef = useRef(null);
  const { messages, clearUnread } = useChatStore();
  const { meetingId, displayName, localSocketId } = useMeetingStore();
  const { token } = useAuthStore();

  // Clear unread when panel opens
  useEffect(() => {
    if (isOpen) {
      clearUnread();
    }
  }, [isOpen, clearUnread]);

  // Fetch chat history when panel first opens
  useEffect(() => {
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
      } catch (err) {
        console.error('[Chat] Failed to fetch history:', err);
      }
    };

    fetchHistory();
  }, [isOpen, meetingId, token]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
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
        absolute top-0 right-0 h-full w-80 bg-[#0d0d14] border-l border-white/5
        flex flex-col transition-transform duration-300 ease-in-out z-20
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">In-call messages</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-40">
            <MessageSquare size={32} className="text-slate-500" />
            <p className="text-xs text-slate-500">No messages yet.<br />Say hello!</p>
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

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput onSend={handleSend} disabled={!socket} />
      </div>
    </div>
  );
};

export default ChatPanel;
