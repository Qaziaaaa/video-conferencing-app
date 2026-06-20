import { useEffect } from 'react';
import useChatStore from '../store/useChatStore';
import useMeetingStore from '../store/useMeetingStore';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * useChat — handles incoming chat-message socket events and exposes sendMessage().
 * Chat history is fetched by ChatPanel on open; this hook handles real-time relay.
 */
export const useChat = (socket) => {
  const { addMessage, isChatOpen } = useChatStore();
  const { meetingId, displayName } = useMeetingStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg) => {
      addMessage(msg);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket, addMessage]);

  const sendMessage = (text) => {
    if (!socket || !meetingId || !text.trim()) return;
    if (text.trim().length > 1000) return;

    socket.emit('chat-message', {
      meetingId,
      senderName: displayName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });
  };

  return { sendMessage };
};
