import { useEffect } from 'react';
import useMeetingStore from '../store/useMeetingStore';
import useUIStore from '../store/useUIStore';

/**
 * useParticipants — subscribes to participant-related socket events and
 * keeps the Zustand participants map in sync.
 *
 * Note: user-joined, user-left, host-changed, participant-media-state,
 * raise-hand, lower-hand are also handled in useWebRTC for PC management.
 * This hook handles the notification side effects.
 */
export const useParticipants = (socket) => {
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ socketId, displayName }) => {
      addNotification(`${displayName} joined the meeting`);
    };

    const handleUserLeft = ({ socketId, displayName }) => {
      addNotification(`${displayName} left the meeting`);
    };

    const handleRaiseHand = ({ socketId, displayName }) => {
      addNotification(`${displayName} raised their hand ✋`);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('raise-hand', handleRaiseHand);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('raise-hand', handleRaiseHand);
    };
  }, [socket, addNotification]);
};
