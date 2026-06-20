import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoOff, Home } from 'lucide-react';

const MeetingNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 bg-surface-2 border border-border rounded-2xl flex items-center justify-center mx-auto">
          <VideoOff className="w-8 h-8 text-text-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">Meeting not found</h1>
          <p className="text-text-3 text-sm leading-relaxed">
            This meeting doesn't exist or may have ended.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover rounded-xl font-medium text-white transition-all duration-200 text-sm shadow-lg shadow-accent-glow"
        >
          <Home className="w-4 h-4" />
          Go home
        </button>
      </div>
    </div>
  );
};

export default MeetingNotFound;
