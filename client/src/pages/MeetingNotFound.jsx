import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoOff, Home } from 'lucide-react';

const MeetingNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-[#111118] border border-white/5 rounded-2xl flex items-center justify-center mx-auto">
          <VideoOff className="w-10 h-10 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Meeting not found</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The meeting you're looking for doesn't exist or may have ended.
            Double-check the link and try again.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Home className="w-4 h-4" />
          Go home
        </button>
      </div>
    </div>
  );
};

export default MeetingNotFound;
