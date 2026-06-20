import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import useMeetingStore from '../store/useMeetingStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const WaitingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { displayName } = useMeetingStore();
  const [denied, setDenied] = useState(false);
  const [socketRef] = useState(() => io(SERVER_URL));

  useEffect(() => {
    const socket = socketRef;

    socket.on('connect', () => {
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
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 bg-danger-soft border border-danger/20 rounded-2xl flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-danger" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight mb-1">Request denied</h1>
            <p className="text-text-3 text-sm">
              The host has declined your request to join this meeting.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-surface-2 border border-border hover:border-border-2 rounded-xl font-medium text-white transition-all duration-200 text-sm"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 bg-accent-soft border border-accent/20 rounded-2xl flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">Waiting to be admitted</h1>
          <p className="text-text-3 text-sm leading-relaxed">
            The host will let you in soon.
          </p>
        </div>
        <div className="px-4 py-3 bg-surface-2 border border-border rounded-xl">
          <p className="text-xs text-text-4 font-mono">
            Meeting: <span className="text-accent">{meetingId}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
