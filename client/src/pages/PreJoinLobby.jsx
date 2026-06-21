import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Loader2, AlertCircle, Camera } from 'lucide-react';
import useMeetingStore from '../store/useMeetingStore';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PreJoinLobby = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { token, displayName: authDisplayName } = useAuthStore();
  const { setMeetingId, setDisplayName, setLocalStream } = useMeetingStore();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [displayName, setLocalDisplayName] = useState(authDisplayName || '');
  const [meetingValid, setMeetingValid] = useState(null);
  const [stream, setStream] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [joining, setJoining] = useState(false);
  const [started, setStarted] = useState(false);

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
        setMeetingValid(true);
      }
    };
    validate();
  }, [meetingId, navigate]);

  const startMedia = useCallback(async () => {
    setStarted(true);
    setMediaError('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
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
  }, []);

  useEffect(() => {
    return () => {
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

    setMeetingId(meetingId);
    setDisplayName(displayName.trim());

    if (stream) setLocalStream(stream);

    if (!token) {
      navigate(`/login?redirect=/meeting/${meetingId}/room`);
      return;
    }
    navigate(`/meeting/${meetingId}/room`);
  };

  const nameValid = displayName.trim().length >= 1 && displayName.trim().length <= 50;

  if (meetingValid === null) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const showPlaceholder = !stream && !started;
  const showStream = stream || (started && !stream);

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="relative w-full aspect-video bg-surface-2 rounded-2xl overflow-hidden border border-border shadow-2xl">
            {showPlaceholder ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-4 p-6 text-center">
                <Camera className="w-10 h-10" />
                <p className="text-sm">Tap to enable camera & microphone</p>
                <button
                  onClick={startMedia}
                  className="mt-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg shadow-accent-glow"
                >
                  Start camera
                </button>
              </div>
            ) : (
              <>
                {stream && isCamOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-4">
                    <VideoOff className="w-10 h-10" />
                    <p className="text-sm">Camera is off</p>
                  </div>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={toggleMic}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isMicOn
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-danger-soft hover:bg-danger/30 text-danger'
                    }`}
                    aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isMicOn ? <Mic className="w-[18px] h-[18px]" /> : <MicOff className="w-[18px] h-[18px]" />}
                  </button>
                  <button
                    onClick={toggleCam}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isCamOn
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-danger-soft hover:bg-danger/30 text-danger'
                    }`}
                    aria-label={isCamOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isCamOn ? <Video className="w-[18px] h-[18px]" /> : <VideoOff className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-5 w-full max-w-sm md:max-w-none">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Ready to join?</h1>
              <p className="text-sm text-text-3 break-all">
                Meeting: <span className="text-accent font-mono font-medium">{meetingId}</span>
              </p>
            </div>

            {mediaError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-warning-soft border border-warning/20 rounded-xl text-warning text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1.5">
                Your name <span className="text-text-4 font-normal">({displayName.trim().length}/50)</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && nameValid && handleJoin()}
                maxLength={50}
                placeholder="Enter your display name"
                autoFocus
                className="w-full bg-surface border border-border-2 rounded-xl px-4 py-3 text-white placeholder-text-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200 text-sm"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!nameValid || joining}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-accent-glow active:scale-[0.98]"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {joining ? 'Joining…' : 'Join now'}
            </button>

            <p className="text-xs text-text-4 text-center">
              By joining, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreJoinLobby;
