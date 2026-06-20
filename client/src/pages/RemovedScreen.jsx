import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home } from 'lucide-react';

const RemovedScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 bg-danger-soft border border-danger/20 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">You were removed</h1>
          <p className="text-text-3 text-sm leading-relaxed">
            The host has removed you from this meeting.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-surface-2 border border-border hover:border-border-2 rounded-xl font-medium text-white transition-all duration-200 text-sm"
        >
          <Home className="w-4 h-4" />
          Go home
        </button>
      </div>
    </div>
  );
};

export default RemovedScreen;
