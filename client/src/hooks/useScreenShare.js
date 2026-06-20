import { useCallback, useRef } from 'react';
import useMeetingStore from '../store/useMeetingStore';

export const useScreenShare = (socket, replaceVideoTrack, originalCameraTrackRef) => {
  const { meetingId } = useMeetingStore();
  const screenTrackRef = useRef(null);

  const stopScreenShare = useCallback(async () => {
    try {
      if (originalCameraTrackRef?.current && replaceVideoTrack) {
        await replaceVideoTrack(originalCameraTrackRef.current);
      }

      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      useMeetingStore.getState().setScreenSharing(false);
      useMeetingStore.getState().setActiveScreenShare(null);
      useMeetingStore.getState().setScreenShareStream(null);

      if (socket && meetingId) {
        socket.emit('screen-share-stopped', { meetingId });
      }
    } catch (err) {
      console.error('[ScreenShare] Stop error:', err);
    }
  }, [socket, meetingId, replaceVideoTrack, originalCameraTrackRef]);

  const startScreenShare = useCallback(async () => {
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

      if (replaceVideoTrack) {
        await replaceVideoTrack(screenTrack);
      }

      useMeetingStore.getState().setScreenShareStream(stream);
      useMeetingStore.getState().setScreenSharing(true);
      const { localSocketId } = useMeetingStore.getState();
      useMeetingStore.getState().setActiveScreenShare(localSocketId);

      if (socket && meetingId) {
        socket.emit('screen-share-started', { meetingId });
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        console.error('[ScreenShare] Start error:', err);
      }
    }
  }, [socket, meetingId, replaceVideoTrack, stopScreenShare]);

  return { startScreenShare, stopScreenShare };
};
