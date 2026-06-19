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
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      const { toggleMic, toggleCam, toggleHand, isMicOn, isCamOn, isHandRaised, meetingId, displayName } = useMeetingStore.getState();
      const { showConfirmLeave } = useUIStore.getState();

      switch (e.key.toLowerCase()) {
        case 'm':
          e.preventDefault();
          toggleMic();
          // After toggleMic, the state will be flipped
          // Emit the NEW state (isMicOn was true → now muted/isMuted=true)
          socket?.emit('participant-media-state', {
            meetingId,
            isMuted: isMicOn,   // was ON → now MUTED
            isCameraOff: !isCamOn,
          });
          break;

        case 'v':
          e.preventDefault();
          toggleCam();
          // Emit the NEW state (isCamOn was true → now off/isCameraOff=true)
          socket?.emit('participant-media-state', {
            meetingId,
            isMuted: !isMicOn,
            isCameraOff: isCamOn, // was ON → now OFF
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
