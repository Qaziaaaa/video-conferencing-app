import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MeetingLayout from '../components/layout/MeetingLayout';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChat } from '../hooks/useChat';
import { useScreenShare } from '../hooks/useScreenShare';
import { useRecording } from '../hooks/useRecording';
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
  const socketRef = useRef(socket);
  socketRef.current = socket;

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

  const { toggleRecording } = useRecording();

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

  // ── Emoji reaction ─────────────────────────────────────────────────────────
  const handleReact = useCallback((emoji) => {
    // Read current values from store at call time to avoid stale closure
    const { displayName: currentName, meetingId: currentMeetingId } = useMeetingStore.getState();
    // Optimistic local update — appears instantly without server round-trip
    useMeetingStore.getState().addReaction(emoji, socketRef.current?.id, currentName);
    // Also send to remote peers
    socketRef.current?.emit('emoji-reaction', { meetingId: currentMeetingId, emoji, displayName: currentName });
  }, []); // no closed-over values from render scope — reads store directly at call time

  // ── Lock/unlock meeting ─────────────────────────────────────────────────────
  const handleToggleLock = useCallback(() => {
    const { isRoomLocked: locked } = useMeetingStore.getState();
    if (locked) {
      socket?.emit('unlock-room', { meetingId });
      useMeetingStore.getState().setRoomLocked(false);
    } else {
      socket?.emit('lock-room', { meetingId });
      useMeetingStore.getState().setRoomLocked(true);
    }
  }, [socket, meetingId]);

  // ── Listen for socket events (mute, lock, reactions) ────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onMute = () => {
      useMeetingStore.getState().toggleMic();
    };
    const onLocked = () => {
      useMeetingStore.getState().setRoomLocked(true);
    };
    const onUnlocked = () => {
      useMeetingStore.getState().setRoomLocked(false);
    };
    const onEmoji = ({ emoji, socketId, displayName: name }) => {
      useMeetingStore.getState().addReaction(emoji, socketId, name);
    };

    socket.on('mute-participant', onMute);
    socket.on('room-locked', onLocked);
    socket.on('room-unlocked', onUnlocked);
    socket.on('emoji-reaction', onEmoji);

    return () => {
      socket.off('mute-participant', onMute);
      socket.off('room-locked', onLocked);
      socket.off('room-unlocked', onUnlocked);
      socket.off('emoji-reaction', onEmoji);
    };
  }, [socket]);

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

  // ── Clean up meeting state on unmount (including back button) ────────────
  // NOTE: We deliberately do NOT reset stores here.  React StrictMode double-
  // mount would reset meetingId and trigger the redirect effect below before
  // the second mount.  Stores are fully reset in handleLeave (explicit leave)
  // and stale data is overwritten on the next MeetingRoom mount via useWebRTC.
  useEffect(() => {
    return () => {
      const state = useMeetingStore.getState();
      if (state.meetingId) {
        if (state.localStream) {
          state.localStream.getTracks().forEach((t) => t.stop());
        }
        socketRef.current?.disconnect();
      }
    };
  }, []);

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
      onToggleRecording={toggleRecording}
      onReact={handleReact}
      onToggleLock={handleToggleLock}
      onLeave={handleLeave}
      onKickParticipant={handleKickParticipant}
    />
  );
};

export default MeetingRoom;
