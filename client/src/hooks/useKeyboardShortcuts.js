import { useEffect } from 'react';
import useMeetingStore from '../store/useMeetingStore';
import useUIStore from '../store/useUIStore';

/**
 * useKeyboardShortcuts — binds keyboard shortcuts for the meeting room.
 *   M → toggle mic
 *   V → toggle camera
 *   H → toggle raise hand
 *   Escape → show leave confirmation dialog
 */
export const useKeyboardShortcuts = (socket) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire shortcuts when typing in an input/textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      const { toggleMic, toggleCam, toggleHand, isMicOn, isCamOn, isHandRaised, meetingId, displayName } = useMeetingStore.getState();
      const { showConfirmLeave } = useUIStore.getState();

      switch (e.key.toLowerCase()) {
        case 'm':
          e.preventDefault();
          toggleMic();
          // Emit media state update
          socket?.emit('participant-media-state', {
            meetingId,
            isMuted: isMicOn, // after toggle, isMicOn will be flipped
            isCameraOff: !isCamOn,
          });
          break;

        case 'v':
          e.preventDefault();
          toggleCam();
          socket?.emit('participant-media-state', {
            meetingId,
            isMuted: !isMicOn,
            isCameraOff: isCamOn, // after toggle, isCamOn will be flipped
          });
          break;

        case 'h':
          e.preventDefault();
          toggleHand();
          if (!isHandRaised) {
            socket?.emit('raise-hand', { meetingId, displayName });
          } else {
            socket?.emit('lower-hand', { meetingId });
          }
          break;

        case 'escape':
          e.preventDefault();
          showConfirmLeave();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket]);
};
