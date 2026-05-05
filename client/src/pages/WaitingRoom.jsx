import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import useMeetingStore from '../store/useMeetingStore';

const SERVER_URL = 'http://localhost:5000';

const WaitingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { displayName } = useMeetingStore();
  const [denied, setDenied] = useState(false);
  const [socketRef] = useState(() => io(SERVER_URL));

  useEffect(() => {
    const socket = socketRef;

    socket.on('connect', () => {
      // Announce we're waiting
      socket.emit('join-room', { meetingId, displayName: displayName || 'Guest' });
    });

    socket.on('admitted', () => {
      socket.disconnect();
      navigate(`/meeting/${meetingId}/room`);
    });

    socket.on('denied', () => {
      setDenied(true);
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [meetingId, displayName, navigate, socketRef]);

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Request denied</h1>
            <p className="text-slate-400 text-sm">
              The host has declined your request to join this meeting.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#111118] border border-white/10 hover:border-white/20 rounded-xl font-medium text-white transition-all"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Waiting to be admitted</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The host will let you in soon. Please wait…
          </p>
        </div>
        <div className="px-4 py-3 bg-[#111118] border border-white/5 rounded-xl">
          <p className="text-xs text-slate-500 font-mono">
            Meeting: <span className="text-blue-400">{meetingId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
