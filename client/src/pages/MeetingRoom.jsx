import React, { useEffect, useRef } from 'react';
import useMeetingStore from '../store/useMeetingStore';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoPlayer = ({ stream, isLocal = false, userId }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl transition-all hover:scale-[1.02] hover:border-blue-500/50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full text-[10px] font-bold font-mono tracking-wider">
        <div className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-blue-500' : 'bg-green-500'}`} />
        {isLocal ? 'LOCAL STREAM' : `REMOTE: ${userId?.substr(0, 5)}`}
      </div>
    </div>
  );
};

const MeetingRoom = () => {
  const { 
    roomId, 
    userId, 
    localStream, 
    remoteStreams, 
    mediaError,
    connectionStatus,
    setRoomId
  } = useMeetingStore();
  
  useWebRTC(roomId, userId);

  const handleLeave = () => {
    setRoomId(null);
    window.location.reload(); 
  };

  const remoteUserIds = Object.keys(remoteStreams);

  return (
    <div className="flex flex-col h-screen bg-black text-white p-6 md:p-12 overflow-hidden relative font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] pointer-events-none" />

      {/* Dynamic Status Overlay */}
      {mediaError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-8 py-4 rounded-3xl shadow-2xl border border-red-400 backdrop-blur-xl animate-pulse">
          <p className="font-bold flex items-center gap-3 text-sm tracking-wide text-white">
            <span className="text-xl">⚠️</span> {mediaError}
          </p>
        </div>
      )}

      {/* Header with Visual Connectivity Status */}
      <div className="flex items-center justify-between mb-10 z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-600'
            }`} />
            <h2 className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              {connectionStatus.toUpperCase()} [PHASE 5 PEER]
            </h2>
          </div>
          <p className="text-[10px] text-slate-600 font-mono tracking-tighter opacity-80 uppercase">
            SECURE_TUNNEL: {roomId?.slice(0, 8)}...
          </p>
        </div>

        <button 
          onClick={handleLeave}
          className="group flex items-center gap-2 px-8 py-3 bg-red-500/5 hover:bg-red-600 border border-red-500/20 hover:border-red-600 rounded-2xl transition-all duration-300 text-xs font-black uppercase tracking-[0.2em] text-red-500 hover:text-white shadow-lg hover:shadow-red-500/20"
        >
          <span>End Call</span>
        </button>
      </div>

      {/* Main Connection Interface */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-7xl mx-auto py-8 z-10">
        {/* Local Stream Slot */}
        <div className="relative w-full aspect-video md:w-1/2 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative h-full bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {localStream ? (
              <VideoPlayer stream={localStream} isLocal userId="You" />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-slate-400 rounded-full animate-spin" />
                <p className="text-xs uppercase tracking-widest font-mono">Camera Warming...</p>
              </div>
            )}
          </div>
        </div>

        {/* Remote Stream Slot */}
        <div className="relative w-full aspect-video md:w-1/2 group">
          <div className={`absolute -inset-1 rounded-3xl blur opacity-10 transition duration-1000 ${
            connectionStatus === 'connected' ? 'bg-green-600/20' : 'bg-slate-800/20'
          }`}></div>
          <div className="relative h-full bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {remoteUserIds.length > 0 ? (
              <VideoPlayer 
                stream={remoteStreams[remoteUserIds[0]]} 
                userId={remoteUserIds[0]} 
              />
            ) : (
              <div className="flex flex-col items-center gap-6 text-center px-12">
                <div className="w-10 h-10 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="space-y-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Awaiting Remote Signal</p>
                  <p className="text-[9px] px-3 py-1 bg-slate-800/50 rounded-lg text-slate-400 font-mono border border-white/5">
                    ID: {roomId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 py-6 border-t border-white/5 flex items-center justify-center opacity-20 z-10">
        <p className="text-[9px] font-mono tracking-[0.3em] uppercase">
          E2E ENCRYPTION ACTIVE | WEBRTC STABILIZATION LAYER OPN
        </p>
      </div>
    </div>
  );
};

export default MeetingRoom;
