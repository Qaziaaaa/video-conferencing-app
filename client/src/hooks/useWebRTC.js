import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useMeetingStore from '../store/useMeetingStore';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = 'http://localhost:5000';

const PC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Full-mesh WebRTC hook.
 * Manages a Map<socketId, RTCPeerConnection> for multi-party conferencing.
 * Exposes replaceVideoTrack() for screen sharing.
 */
export const useWebRTC = () => {
  const socketRef = useRef(null);
  // Map<socketId, RTCPeerConnection>
  const peerConnectionsRef = useRef(new Map());
  // Map<socketId, RTCIceCandidateInit[]> — buffer ICE until remoteDesc is set
  const iceBuffersRef = useRef(new Map());
  // Map<socketId, boolean> — track if ICE restart was already attempted
  const iceRestartAttemptedRef = useRef(new Map());
  // Ref to local stream (set from store or captured fresh)
  const localStreamRef = useRef(null);
  // Original camera track (for restoring after screen share)
  const originalCameraTrackRef = useRef(null);

  const {
    meetingId,
    displayName,
    localStream,
    setLocalStream,
    setLocalSocketId,
    setRemoteStream,
    removeRemoteStream,
    setConnectionState,
    removeConnectionState,
    upsertParticipant,
    removeParticipant,
    setParticipants,
    setHost,
    setConnectionStatus,
    setMediaError,
    setActiveScreenShare,
    toggleMic,
    toggleCam,
    isMicOn,
    isCamOn,
    reset,
  } = useMeetingStore.getState();

  const { token } = useAuthStore.getState();

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getSocket = () => socketRef.current;

  const flushIceBuffer = useCallback(async (peerId) => {
    const pc = peerConnectionsRef.current.get(peerId);
    const buffer = iceBuffersRef.current.get(peerId) || [];
    if (!pc || !pc.remoteDescription) return;
    while (buffer.length > 0) {
      const cand = buffer.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        // Ignore stale candidates
      }
    }
    iceBuffersRef.current.set(peerId, buffer);
  }, []);

  const createPeerConnection = useCallback((peerId) => {
    // Close existing PC for this peer if any
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) {
      existing.close();
    }

    const pc = new RTCPeerConnection(PC_CONFIG);
    peerConnectionsRef.current.set(peerId, pc);
    iceBuffersRef.current.set(peerId, []);
    iceRestartAttemptedRef.current.set(peerId, false);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE candidate handler — targeted to specific peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          targetSocketId: peerId,
          meetingId,
        });
      }
    };

    // Remote track received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        useMeetingStore.getState().setRemoteStream(peerId, event.streams[0]);
        useMeetingStore.getState().setConnectionState(peerId, 'connected');
        useMeetingStore.getState().setConnectionStatus('connected');
      }
    };

    // ICE connection state changes
    pc.oniceconnectionstatechange = async () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE state for ${peerId}: ${state}`);

      if (state === 'connected' || state === 'completed') {
        useMeetingStore.getState().setConnectionState(peerId, 'connected');
      } else if (state === 'failed') {
        const alreadyAttempted = iceRestartAttemptedRef.current.get(peerId);
        if (!alreadyAttempted) {
          // Attempt one ICE restart
          iceRestartAttemptedRef.current.set(peerId, true);
          console.log(`[WebRTC] ICE failed for ${peerId}, attempting restart...`);
          try {
            pc.restartIce();
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            socketRef.current?.emit('offer', {
              sdp: offer,
              targetSocketId: peerId,
              meetingId,
            });
          } catch (err) {
            console.error('[WebRTC] ICE restart failed:', err);
            useMeetingStore.getState().setConnectionState(peerId, 'failed');
          }
        } else {
          useMeetingStore.getState().setConnectionState(peerId, 'failed');
        }
      } else if (state === 'disconnected') {
        useMeetingStore.getState().setConnectionState(peerId, 'connecting');
      }
    };

    return pc;
  }, [meetingId]);

  // ─── Screen Share Track Replacement ─────────────────────────────────────────

  const replaceVideoTrack = useCallback(async (newTrack) => {
    const promises = [];
    peerConnectionsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        promises.push(sender.replaceTrack(newTrack));
      }
    });
    await Promise.all(promises);
  }, []);

  // ─── Main Effect ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!meetingId || !displayName) return;

    const socket = io(SERVER_URL, {
      auth: { token: token || '' },
    });
    socketRef.current = socket;

    // ── Media capture ──────────────────────────────────────────────────────────
    const initMedia = async () => {
      // Reuse stream from PreJoinLobby if already in store
      const existingStream = useMeetingStore.getState().localStream;
      if (existingStream && existingStream.active) {
        localStreamRef.current = existingStream;
        // Store original camera track for screen share restore
        const videoTrack = existingStream.getVideoTracks()[0];
        if (videoTrack) originalCameraTrackRef.current = videoTrack;
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
        localStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) originalCameraTrackRef.current = videoTrack;
        useMeetingStore.getState().setLocalStream(stream);
      } catch (err) {
        console.error('[WebRTC] Media capture failed:', err);
        useMeetingStore.getState().setMediaError(
          `Camera/mic error: ${err.name}. Check permissions.`
        );
        // Try audio-only fallback
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioOnly;
          useMeetingStore.getState().setLocalStream(audioOnly);
        } catch {
          // No media at all — proceed without
        }
      }
    };

    // ── Socket event handlers ──────────────────────────────────────────────────

    socket.on('connect', async () => {
      console.log(`[WebRTC] Socket connected: ${socket.id}`);
      useMeetingStore.getState().setLocalSocketId(socket.id);

      await initMedia();

      socket.emit('join-room', { meetingId, displayName });
    });

    // Server sends back our room info + existing participants list
    socket.on('room-joined', ({ isHost, existingParticipants }) => {
      useMeetingStore.getState().setHost(isHost);
      useMeetingStore.getState().setConnectionStatus('connecting');

      // Add self to participants
      useMeetingStore.getState().upsertParticipant(socket.id, {
        socketId: socket.id,
        displayName,
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isScreenSharing: false,
        isHost,
      });

      // Seed existing participants into store
      existingParticipants.forEach((p) => {
        useMeetingStore.getState().upsertParticipant(p.socketId, p);
      });

      // As the newcomer, create offers to ALL existing participants
      existingParticipants.forEach(async (participant) => {
        const pc = createPeerConnection(participant.socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            sdp: offer,
            targetSocketId: participant.socketId,
            meetingId,
          });
        } catch (err) {
          console.error(`[WebRTC] Failed to create offer for ${participant.socketId}:`, err);
        }
      });
    });

    // A new participant joined — they will send us an offer; we just add them to participants
    socket.on('user-joined', ({ socketId, displayName: peerName, isHost: peerIsHost }) => {
      console.log(`[WebRTC] User joined: ${socketId} (${peerName})`);
      useMeetingStore.getState().upsertParticipant(socketId, {
        socketId,
        displayName: peerName,
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isScreenSharing: false,
        isHost: peerIsHost || false,
      });
      useMeetingStore.getState().setConnectionState(socketId, 'connecting');
    });

    // Receive offer from a peer (they joined after us, or ICE restart)
    socket.on('offer', async ({ sdp, fromSocketId }) => {
      console.log(`[WebRTC] Received offer from ${fromSocketId}`);
      const pc = createPeerConnection(fromSocketId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceBuffer(fromSocketId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          sdp: answer,
          targetSocketId: fromSocketId,
          meetingId,
        });
      } catch (err) {
        console.error(`[WebRTC] Failed to handle offer from ${fromSocketId}:`, err);
      }
    });

    // Receive answer from a peer
    socket.on('answer', async ({ sdp, fromSocketId }) => {
      console.log(`[WebRTC] Received answer from ${fromSocketId}`);
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceBuffer(fromSocketId);
      } catch (err) {
        console.error(`[WebRTC] Failed to handle answer from ${fromSocketId}:`, err);
      }
    });

    // Receive ICE candidate
    socket.on('ice-candidate', async ({ candidate, fromSocketId }) => {
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Ignore stale candidates
        }
      } else {
        // Buffer until remote description is set
        const buffer = iceBuffersRef.current.get(fromSocketId) || [];
        buffer.push(candidate);
        iceBuffersRef.current.set(fromSocketId, buffer);
      }
    });

    // Participant left
    socket.on('user-left', ({ socketId, displayName: peerName }) => {
      console.log(`[WebRTC] User left: ${socketId}`);
      const pc = peerConnectionsRef.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(socketId);
      }
      iceBuffersRef.current.delete(socketId);
      iceRestartAttemptedRef.current.delete(socketId);
      useMeetingStore.getState().removeRemoteStream(socketId);
      useMeetingStore.getState().removeParticipant(socketId);
      useMeetingStore.getState().removeConnectionState(socketId);
    });

    // Host changed
    socket.on('host-changed', ({ newHostSocketId }) => {
      const isNowHost = newHostSocketId === socket.id;
      useMeetingStore.getState().setHost(isNowHost);
      // Update participant metadata
      const participants = useMeetingStore.getState().participants;
      Object.keys(participants).forEach((sid) => {
        useMeetingStore.getState().upsertParticipant(sid, { isHost: sid === newHostSocketId });
      });
    });

    // Kicked by host
    socket.on('you-were-removed', () => {
      cleanup();
      window.location.href = '/removed';
    });

    // Media state updates from peers
    socket.on('participant-media-state', ({ socketId, isMuted, isCameraOff }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isMuted, isCameraOff });
    });

    // Screen share events
    socket.on('screen-share-started', ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isScreenSharing: true });
      useMeetingStore.getState().setActiveScreenShare(socketId);
    });

    socket.on('screen-share-stopped', ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isScreenSharing: false });
      useMeetingStore.getState().setActiveScreenShare(null);
    });

    // Raise/lower hand
    socket.on('raise-hand', ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isHandRaised: true });
    });

    socket.on('lower-hand', ({ socketId }) => {
      useMeetingStore.getState().upsertParticipant(socketId, { isHandRaised: false });
    });

    // Waiting room
    socket.on('participant-waiting', ({ socketId, displayName: waitingName }) => {
      // Handled by AdmissionPanel via store — just log here
      console.log(`[WebRTC] Participant waiting: ${waitingName} (${socketId})`);
      useMeetingStore.getState().upsertParticipant(socketId, {
        socketId,
        displayName: waitingName,
        isWaiting: true,
      });
    });

    socket.on('room-full', () => {
      useMeetingStore.getState().setMediaError('This meeting is full (max 8 participants).');
    });

    socket.on('meeting-not-found', () => {
      window.location.href = '/meeting-not-found';
    });

    socket.on('error-msg', ({ message }) => {
      console.error('[WebRTC] Server error:', message);
      useMeetingStore.getState().setMediaError(message);
    });

    socket.on('disconnect', () => {
      console.log('[WebRTC] Socket disconnected');
      useMeetingStore.getState().setConnectionStatus('disconnected');
    });

    // ── Cleanup ────────────────────────────────────────────────────────────────
    const cleanup = () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      iceBuffersRef.current.clear();
      iceRestartAttemptedRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      socket.disconnect();
      socketRef.current = null;
    };

    return cleanup;
  }, [meetingId, displayName, token, createPeerConnection, flushIceBuffer]);

  return {
    socket: socketRef.current,
    peerConnections: peerConnectionsRef.current,
    replaceVideoTrack,
    originalCameraTrackRef,
  };
};
