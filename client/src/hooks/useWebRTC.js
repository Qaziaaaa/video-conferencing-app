import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useMeetingStore from '../store/useMeetingStore';

const SERVER_URL = 'http://localhost:5000';

const pc_config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId, userId) => {
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceBufferRef = useRef([]); // Buffer ICE candidates until RemoteDesc is set

  const { 
    setLocalStream, 
    setRemoteStream, 
    removeRemoteStream, 
    setConnectionStatus, 
    setMediaError 
  } = useMeetingStore();

  const cleanup = useCallback(() => {
    console.log('[DEBUG] Cleaning up WebRTC...');
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  const initPeerConnection = useCallback((targetUserId) => {
    console.log(`[DEBUG] Initializing RTCPeerConnection for ${targetUserId}`);

    // Phase 4 Protection: Only one connection per user
    if (pcRef.current) {
      console.warn('[DEBUG] Closing existing peer connection before re-initiating.');
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(pc_config);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('[DEBUG] Local ICE candidate found. Sending...');
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[DEBUG] Remote track received:', event.streams[0]);
      setRemoteStream(targetUserId, event.streams[0]);
      setConnectionStatus('connected');
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[DEBUG] ICE connection state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected') setConnectionStatus('connected');
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn(`[DEBUG] Connection lost: ${pc.iceConnectionState}`);
      }
    };

    // Phase 3: Add local tracks before signaling
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [roomId, setRemoteStream, setConnectionStatus]);

  useEffect(() => {
    // Phase 4: Prevent duplicate socket creation
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    console.log('[DEBUG] Hook mounted. Initializing signaling...');

    // Phase 2 Step 1 & 2: Set up listeners BEFORE any signaling activity
    socket.on('connect', () => {
      console.log(`[DEBUG] Signaling Socket Connected: ${socket.id}`);
      // Join room once connected
      socket.emit('join-room', roomId, userId);
    });

    socket.on('user-joined', async (newUserId) => {
      console.log(`[DEBUG] Peer Joined: ${newUserId}. Creating Offer...`);
      const pc = initPeerConnection(newUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { sdp: offer, roomId });
    });

    socket.on('offer', async (data) => {
      console.log(`[DEBUG] Recieved Offer from ${data.userId}. Creating Answer...`);
      const pc = initPeerConnection(data.userId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      
      // Flush buffered ICE candidates
      while (iceBufferRef.current.length > 0) {
        const cand = iceBufferRef.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { sdp: answer, roomId });
    });

    socket.on('answer', async (data) => {
      console.log(`[DEBUG] Received Answer from ${data.userId}`);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Flush buffered ICE candidates
        while (iceBufferRef.current.length > 0) {
          const cand = iceBufferRef.current.shift();
          await pcRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      console.log(`[DEBUG] ICE candidate received from ${data.userId}`);
      if (pcRef.current && pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      } else {
        console.log('[DEBUG] Buffering ICE candidate (RemoteDesc not yet set)');
        iceBufferRef.current.push(data.candidate);
      }
    });

    socket.on('user-left', (leftUserId) => {
      console.log(`[DEBUG] User Left: ${leftUserId}`);
      removeRemoteStream(leftUserId);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setConnectionStatus('disconnected');
    });

    socket.on('error-msg', (msg) => {
      console.error(`[DEBUG] Signaling Error: ${msg}`);
      setMediaError(msg);
    });

    // Phase 3: getUserMedia BEFORE joining room activity
    const captureMedia = async () => {
      try {
        console.log('[DEBUG] Starting media capture...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 1280, height: 720 } 
        });
        
        localStreamRef.current = stream;
        setLocalStream(stream);
        console.log('[DEBUG] Media capture successful.');
      } catch (err) {
        console.error('[DEBUG] Media Error:', err);
        setMediaError(`Media Error: ${err.name}. Ensure camera/mic is accessible.`);
      }
    };

    captureMedia();

    // Phase 4: Zero-leak cleanup
    return () => {
      cleanup();
    };
  }, [roomId, userId, initPeerConnection, setLocalStream, setMediaError, removeRemoteStream, cleanup]);

  return { socket: socketRef.current };
};
