import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home } from 'lucide-react';

const RemovedScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">You were removed</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The host has removed you from this meeting.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#111118] border border-white/10 hover:border-white/20 rounded-xl font-medium text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Home className="w-4 h-4" />
          Go home
        </button>
      </div>
    </div>
  );
};

export default RemovedScreen;
