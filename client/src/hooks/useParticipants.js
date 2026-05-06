import { useEffect } from 'react';
import useMeetingStore from '../store/useMeetingStore';

/**
 * useParticipants — subscribes to participant-related socket events
 * and keeps the Zustand participants map in sync.
 * 
 * Note: user-joined, user-left, host-changed are handled in useWebRTC.
 * This hook handles media state, hand, and screen share events.
 */
export const useParticipants = (socket) => {
  useEffect(() => {
    if (!socket) return;

    const handleMediaState = ({ socketId, isMuted, isCameraOff }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isMuted, isCameraOff });
    };

    const handleRaiseHand = ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isHandRaised: true });
    };

    const handleLowerHand = ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isHandRaised: false });
    };

    const handleScreenShareStarted = ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isScreenSharing: true });
      useMeetingStore.getState().setActiveScreenShare(socketId);
    };

    const handleScreenShareStopped = ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isScreenSharing: false });
      useMeetingStore.getState().setActiveScreenShare(null);
    };

    const handleHostChanged = ({ newHostSocketId }) => {
      const participants = useMeetingStore.getState().participants;
      Object.keys(participants).forEach((sid) => {
        useMeetingStore.getState().upsertParticipant(sid, {
          isHost: sid === newHostSocketId,
        });
      });
      const localSocketId = useMeetingStore.getState().localSocketId;
      useMeetingStore.getState().setHost(newHostSocketId === localSocketId);
    };

    socket.on('participant-media-state', handleMediaState);
    socket.on('raise-hand', handleRaiseHand);
    socket.on('lower-hand', handleLowerHand);
    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);
    socket.on('host-changed', handleHostChanged);

    return () => {
      socket.off('participant-media-state', handleMediaState);
      socket.off('raise-hand', handleRaiseHand);
      socket.off('lower-hand', handleLowerHand);
      socket.off('screen-share-started', handleScreenShareStarted);
      socket.off('screen-share-stopped', handleScreenShareStopped);
      socket.off('host-changed', handleHostChanged);
    };
  }, [socket]);
};
