import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';

/**
 * useNotifications — listens to socket events for join/leave/hand
 * and pushes toast notifications via useUIStore.addNotification.
 * Auto-dismiss (4s) is handled inside useUIStore.
 */
export const useNotifications = (socket) => {
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ displayName }) => {
      if (displayName) {
        addNotification(`${displayName} joined the meeting`);
      }
    };

    const handleUserLeft = ({ displayName }) => {
      if (displayName) {
        addNotification(`${displayName} left the meeting`);
      }
    };

    const handleRaiseHand = ({ displayName }) => {
      if (displayName) {
        addNotification(`✋ ${displayName} raised their hand`);
      }
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
