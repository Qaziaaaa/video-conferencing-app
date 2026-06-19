import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Plus, LogIn, LogOut, Copy, Check, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const { token, displayName, clearAuth } = useAuthStore();

  const [roomInput, setRoomInput] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);

  const handleCreate = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ waitingRoomEnabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create meeting');
        return;
      }
      setShareUrl(data.shareUrl);
      // Navigate to pre-join lobby for the new meeting
      navigate(`/meeting/${data.meetingId}`);
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const code = roomInput.trim();
    if (!code) return;
    // Extract meetingId from full URL or use as-is
    const match = code.match(/\/meeting\/([^/]+)/);
    const meetingId = match ? match[1] : code;
    navigate(`/meeting/${meetingId}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleLogout = () => {
    clearAuth();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">MeetSpace</span>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <span className="text-sm text-slate-400 hidden sm:block">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Real-time video conferencing
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="text-white">Meet without</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              limits
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
            HD video, real-time chat, screen sharing, and more — all in your browser.
          </p>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-4 items-center justify-center pt-4">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={waitingRoomEnabled}
                onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
              />
              Enable Waiting Room
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creating ? 'Creating…' : 'New meeting'}
            </button>

            <form onSubmit={handleJoin} className="flex items-center bg-[#111118] border border-white/10 rounded-xl p-1 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <input
                type="text"
                placeholder="Enter meeting code or link"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="bg-transparent px-4 py-3 outline-none w-52 text-sm text-white placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={!roomInput.trim()}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-blue-400 font-semibold rounded-lg disabled:opacity-40 transition-all text-sm focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <LogIn className="w-4 h-4" />
                Join
              </button>
            </form>
            </div>
          </div>

          {/* Share URL display after creation */}
          {shareUrl && (
            <div className="mt-4 flex items-center gap-2 bg-[#111118] border border-white/10 rounded-xl px-4 py-3 max-w-md mx-auto">
              <span className="text-xs text-slate-400 truncate flex-1 font-mono">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-all shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
          {[
            { icon: '🎥', label: 'HD Video' },
            { icon: '💬', label: 'Live Chat' },
            { icon: '🖥️', label: 'Screen Share' },
            { icon: '✋', label: 'Raise Hand' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 p-4 bg-[#111118] border border-white/5 rounded-xl text-center"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
