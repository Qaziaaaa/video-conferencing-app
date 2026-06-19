import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MeetingLayout from '../components/layout/MeetingLayout';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChat } from '../hooks/useChat';
import { useScreenShare } from '../hooks/useScreenShare';
import { useParticipants } from '../hooks/useParticipants';
import { useNotifications } from '../hooks/useNotifications';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import useMeetingStore from '../store/useMeetingStore';
import useUIStore from '../store/useUIStore';
import useChatStore from '../store/useChatStore';

const MeetingRoom = () => {
  const navigate = useNavigate();

  const {
    meetingId,
    displayName,
    isMicOn,
    isCamOn,
    isHandRaised,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleHand,
    localStream,
    reset: resetMeeting,
  } = useMeetingStore();

  const { hideConfirmLeave } = useUIStore();

  // ── WebRTC (mesh peer connections + socket) ──────────────────────────────
  const { socket, replaceVideoTrack, originalCameraTrackRef } = useWebRTC();

  // ── Supporting hooks ─────────────────────────────────────────────────────
  useChat(socket);
  useParticipants(socket);
  useNotifications(socket);
  useKeyboardShortcuts(socket);

  const { startScreenShare, stopScreenShare } = useScreenShare(
    socket,
    replaceVideoTrack,
    originalCameraTrackRef
  );

  // ── Mute toggle — also emits media state ─────────────────────────────────
  const handleToggleMic = useCallback(() => {
    toggleMic();
    // Read state after toggle
    setTimeout(() => {
      const state = useMeetingStore.getState();
      socket?.emit('participant-media-state', {
        meetingId,
        isMuted: !state.isMicOn,
        isCameraOff: !state.isCamOn,
      });
    }, 0);
  }, [socket, meetingId, toggleMic]);

  // ── Camera toggle — also emits media state ────────────────────────────────
  const handleToggleCam = useCallback(() => {
    toggleCam();
    setTimeout(() => {
      const state = useMeetingStore.getState();
      socket?.emit('participant-media-state', {
        meetingId,
        isMuted: !state.isMicOn,
        isCameraOff: !state.isCamOn,
      });
    }, 0);
  }, [socket, meetingId, toggleCam]);

  // ── Raise/lower hand ──────────────────────────────────────────────────────
  const handleToggleHand = useCallback(() => {
    const { isHandRaised: currentHandState, meetingId: mid, displayName: name } = useMeetingStore.getState();
    toggleHand();
    if (!currentHandState) {
      socket?.emit('raise-hand', { meetingId: mid, displayName: name });
    } else {
      socket?.emit('lower-hand', { meetingId: mid });
    }
  }, [socket, toggleHand]);

  // ── Screen share toggle ───────────────────────────────────────────────────
  const handleToggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // ── Kick participant ──────────────────────────────────────────────────────
  const handleKickParticipant = useCallback((targetSocketId) => {
    socket?.emit('kick-participant', { meetingId, targetSocketId });
  }, [socket, meetingId]);

  // ── Leave meeting ─────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    hideConfirmLeave();

    // Stop all local media tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    // Emit graceful leave
    socket?.emit('leave-room', { meetingId });

    // Disconnect socket (peer connections closed in useWebRTC cleanup)
    socket?.disconnect();

    // Reset stores
    resetMeeting();
    useChatStore.getState().reset();
    useUIStore.getState().reset();

    navigate('/');
  }, [socket, meetingId, localStream, hideConfirmLeave, resetMeeting, navigate]);

  // ── Redirect if no meetingId (e.g. direct navigation) ────────────────────
  useEffect(() => {
    if (!meetingId) {
      navigate('/', { replace: true });
    }
  }, [meetingId, navigate]);

  if (!meetingId) return null;

  return (
    <MeetingLayout
      socket={socket}
      onToggleMic={handleToggleMic}
      onToggleCam={handleToggleCam}
      onToggleHand={handleToggleHand}
      onToggleScreenShare={handleToggleScreenShare}
      onLeave={handleLeave}
      onKickParticipant={handleKickParticipant}
    />
  );
};

export default MeetingRoom;
