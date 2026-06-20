import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Plus, LogIn, LogOut, Copy, Check, Loader2, Monitor, MessageSquare, Hand, Sparkles } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = 'http://localhost:5000';

const features = [
  { icon: Monitor, label: 'HD video', desc: 'Crystal clear 720p' },
  { icon: MessageSquare, label: 'Live chat', desc: 'Real-time messaging' },
  { icon: Sparkles, label: 'Screen share', desc: 'Present with ease' },
  { icon: Hand, label: 'Raise hand', desc: 'Ask to speak' },
];

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
    <div className="min-h-screen bg-base flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent-glow transition-all duration-300 group-hover:shadow-xl group-hover:shadow-accent-glow group-hover:scale-105">
            <Video className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Meet</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent/15 text-accent rounded-md border border-accent/20 tracking-wide uppercase">Beta</span>
        </Link>
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <span className="text-sm text-text-2 hidden sm:block">{displayName}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-2 hover:text-white border border-border-2 hover:border-white/20 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-text-2 hover:text-white transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-accent-glow"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              Video calls for
              <br />
              <span className="text-accent">everyone</span>
            </h1>
            <p className="text-lg text-text-2 max-w-lg mx-auto leading-relaxed">
              HD video, real-time chat, and screen sharing — right in your browser. No downloads required.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-soft/50 border border-warning/20 rounded-xl text-xs text-warning font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              Beta — up to 4 participants per meeting. Enterprise features coming.
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger-soft border border-danger/20 rounded-xl text-danger text-sm animate-[fadeIn_0.2s_ease-out] max-w-md mx-auto">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all duration-200 shadow-lg shadow-accent-glow active:scale-[0.97]"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {creating ? 'Creating…' : 'New meeting'}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px w-6 bg-white/10" />
              <span className="text-xs text-text-4 font-medium">or</span>
              <div className="h-px w-6 bg-white/10" />
            </div>

            <form onSubmit={handleJoin} className="flex items-center bg-surface-2 border border-border-2 rounded-xl focus-within:border-accent/50 transition-all duration-200 overflow-hidden">
              <input
                type="text"
                placeholder="Enter a code or link"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="bg-transparent px-4 py-3.5 outline-none w-44 text-sm text-white placeholder-text-4"
              />
              <button
                type="submit"
                disabled={!roomInput.trim()}
                className="flex items-center gap-1.5 px-4 py-3.5 bg-white/5 hover:bg-white/10 text-accent font-medium disabled:opacity-40 transition-all duration-200 text-sm"
              >
                <LogIn className="w-4 h-4" />
                Join
              </button>
            </form>
          </div>

          <label className="inline-flex items-center justify-center gap-2 text-sm text-text-3 cursor-pointer hover:text-text-2 transition-colors duration-200">
            <input
              type="checkbox"
              checked={waitingRoomEnabled}
              onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/20 text-accent focus:ring-accent/50 focus:ring-offset-0"
            />
            Enable waiting room
          </label>

          {shareUrl && (
            <div className="flex items-center gap-2 bg-surface border border-border-2 rounded-xl px-4 py-3 max-w-md mx-auto animate-[fadeIn_0.2s_ease-out]">
              <span className="text-xs text-text-3 truncate flex-1 font-mono">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-accent-soft hover:bg-accent/20 text-accent rounded-lg text-xs font-medium transition-all shrink-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group flex flex-col items-start gap-2 p-4 bg-surface-2 border border-border rounded-xl hover:border-accent/20 hover:bg-surface-2/80 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                <Icon className="w-[18px] h-[18px] text-accent" />
              </div>
              <div>
                <span className="block text-sm font-medium text-white">{label}</span>
                <span className="block text-xs text-text-3 mt-0.5">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
