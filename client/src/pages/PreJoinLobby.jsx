import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import useMeetingStore from '../store/useMeetingStore';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = 'http://localhost:5000';

const PreJoinLobby = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { token, displayName: authDisplayName } = useAuthStore();
  const { setMeetingId, setDisplayName, setLocalStream } = useMeetingStore();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [displayName, setLocalDisplayName] = useState(authDisplayName || '');
  const [meetingValid, setMeetingValid] = useState(null); // null=loading, true, false
  const [stream, setStream] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [joining, setJoining] = useState(false);

  // Validate meeting exists
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/meetings/${meetingId}`);
        if (res.status === 404) {
          navigate('/meeting-not-found', { replace: true });
          return;
        }
        setMeetingValid(true);
      } catch {
        setMeetingValid(true); // Allow join even if server unreachable (offline mode)
      }
    };
    validate();
  }, [meetingId, navigate]);

  // Request camera/mic
  useEffect(() => {
    const getMedia = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        streamRef.current = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setMediaError('Camera and microphone access denied. You can still join with audio/video off.');
        } else if (err.name === 'NotFoundError') {
          setMediaError('No camera or microphone found. You can still join.');
        } else {
          setMediaError(`Media error: ${err.message}`);
        }
        // Try audio-only fallback
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          streamRef.current = audioOnly;
          setStream(audioOnly);
          setIsCamOn(false);
        } catch {
          setIsCamOn(false);
          setIsMicOn(false);
        }
      }
    };
    getMedia();

    return () => {
      // Stop preview tracks on unmount (they'll be re-acquired in the room)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach((t) => { t.enabled = !isCamOn; });
    }
    setIsCamOn((v) => !v);
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((t) => { t.enabled = !isMicOn; });
    }
    setIsMicOn((v) => !v);
  };

  const handleJoin = () => {
    if (!displayName.trim()) return;
    setJoining(true);

    // Store meeting context
    setMeetingId(meetingId);
    setDisplayName(displayName.trim());

    // Pass the preview stream into the store so useWebRTC can reuse it
    if (stream) setLocalStream(stream);

    // Navigate to room (protected route requires auth)
    if (!token) {
      navigate(`/login`);
      return;
    }
    navigate(`/meeting/${meetingId}/room`);
  };

  const nameValid = displayName.trim().length >= 1 && displayName.trim().length <= 50;

  if (meetingValid === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Camera Preview */}
          <div className="relative aspect-video bg-[#111118] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            {stream && isCamOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600">
                <VideoOff className="w-12 h-12" />
                <p className="text-sm">Camera is off</p>
              </div>
            )}

            {/* Preview controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button
                onClick={toggleMic}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isMicOn
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
                aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleCam}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isCamOn
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
                aria-label={isCamOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Join Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
              <p className="text-slate-400 text-sm font-mono">
                Meeting: <span className="text-blue-400">{meetingId}</span>
              </p>
            </div>

            {mediaError && (
              <div className="flex items-start gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your name <span className="text-slate-500">({displayName.trim().length}/50)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nameValid && handleJoin()}
                maxLength={50}
                placeholder="Enter your display name"
                autoFocus
                className="w-full bg-[#111118] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!nameValid || joining}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white text-lg transition-all shadow-lg shadow-blue-500/20 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
            >
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {joining ? 'Joining…' : 'Join now'}
            </button>

            <p className="text-xs text-slate-600 text-center">
              By joining, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreJoinLobby;
