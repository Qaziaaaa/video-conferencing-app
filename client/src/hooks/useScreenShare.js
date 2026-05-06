import { useCallback, useRef } from 'react';
import useMeetingStore from '../store/useMeetingStore';

/**
 * useScreenShare — manages getDisplayMedia + RTCRtpSender.replaceTrack.
 * Uses replaceVideoTrack from useWebRTC to swap tracks on all peer connections.
 */
export const useScreenShare = (socket, replaceVideoTrack, originalCameraTrackRef) => {
  const { meetingId, setScreenSharing, setActiveScreenShare } = useMeetingStore();
  const screenTrackRef = useRef(null);

  const stopScreenShare = useCallback(async () => {
    try {
      // Restore original camera track on all peer connections
      if (originalCameraTrackRef?.current && replaceVideoTrack) {
        await replaceVideoTrack(originalCameraTrackRef.current);
      }

      // Stop the screen share track
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      // Update local stream video track
      const { localStream } = useMeetingStore.getState();
      if (localStream && originalCameraTrackRef?.current) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((t) => localStream.removeTrack(t));
        localStream.addTrack(originalCameraTrackRef.current);
      }

      useMeetingStore.getState().setScreenSharing(false);
      useMeetingStore.getState().setActiveScreenShare(null);

      if (socket && meetingId) {
        socket.emit('screen-share-stopped', { meetingId });
      }
    } catch (err) {
      console.error('[ScreenShare] Stop error:', err);
    }
  }, [socket, meetingId, replaceVideoTrack, originalCameraTrackRef]);

  const startScreenShare = useCallback(async () => {
    // Check if someone else is already sharing
    const { activeScreenShareSocketId } = useMeetingStore.getState();
    if (activeScreenShareSocketId) {
      useMeetingStore.getState().setMediaError('Screen sharing is already active in this meeting');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenTrackRef.current = screenTrack;

      // Replace video track on all peer connections
      if (replaceVideoTrack) {
        await replaceVideoTrack(screenTrack);
      }

      // Update local stream for local preview
      const { localStream } = useMeetingStore.getState();
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((t) => localStream.removeTrack(t));
        localStream.addTrack(screenTrack);
      }

      useMeetingStore.getState().setScreenSharing(true);
      const { localSocketId } = useMeetingStore.getState();
      useMeetingStore.getState().setActiveScreenShare(localSocketId);

      if (socket && meetingId) {
        socket.emit('screen-share-started', { meetingId });
      }

      // Handle browser native "Stop sharing" button
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      // User cancelled — silently ignore (per Req 7.7)
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.error('[ScreenShare] Start error:', err);
      }
    }
  }, [socket, meetingId, replaceVideoTrack, stopScreenShare]);

  return { startScreenShare, stopScreenShare };
};
