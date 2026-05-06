import { useCallback } from 'react';
import useMeetingStore from '../store/useMeetingStore';

/**
 * useScreenShare — manages getDisplayMedia, track replacement across all PCs,
 * and emits screen-share-started / screen-share-stopped socket events.
 *
 * Requires replaceVideoTrack and originalCameraTrackRef from useWebRTC.
 */
export const useScreenShare = (socket, replaceVideoTrack, originalCameraTrackRef) => {
  const { meetingId, isScreenSharing, setScreenSharing, setScreenShareStream, activeScreenShareSocketId } = useMeetingStore();

  const startScreenShare = useCallback(async () => {
    // Only one person can share at a time
    if (activeScreenShareSocketId) {
      useMeetingStore.getState().setMediaError('Screen sharing is already active in this meeting.');
      setTimeout(() => useMeetingStore.getState().setMediaError(null), 3000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;

      // Replace video track in all peer connections
      await replaceVideoTrack(screenTrack);

      // Update local stream preview
      const localStream = useMeetingStore.getState().localStream;
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(screenTrack);
      }

      setScreenShareStream(stream);
      setScreenSharing(true);

      // Notify peers
      socket?.emit('screen-share-started', { meetingId });

      // Handle browser native "Stop sharing" button
      screenTrack.onended = () => {
        stopScreenShare(screenTrack);
      };
    } catch (err) {
      // User cancelled getDisplayMedia — silently ignore per Req 7.7
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.error('[ScreenShare] Error:', err);
      }
    }
  }, [socket, meetingId, replaceVideoTrack, activeScreenShareSocketId, setScreenSharing, setScreenShareStream]);

  const stopScreenShare = useCallback(async (screenTrack) => {
    const originalTrack = originalCameraTrackRef?.current;

    // Restore original camera track in all peer connections
    if (originalTrack) {
      await replaceVideoTrack(originalTrack);

      // Restore in local stream
      const localStream = useMeetingStore.getState().localStream;
      if (localStream) {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack && currentVideoTrack !== originalTrack) {
          localStream.removeTrack(currentVideoTrack);
        }
        if (!localStream.getVideoTracks().includes(originalTrack)) {
          localStream.addTrack(originalTrack);
        }
      }
    }

    // Stop screen share stream tracks
    const screenShareStream = useMeetingStore.getState().screenShareStream;
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((t) => t.stop());
    }

    setScreenShareStream(null);
    setScreenSharing(false);

    // Notify peers
    socket?.emit('screen-share-stopped', { meetingId });
  }, [socket, meetingId, replaceVideoTrack, originalCameraTrackRef, setScreenSharing, setScreenShareStream]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  return { startScreenShare, stopScreenShare, toggleScreenShare };
};
