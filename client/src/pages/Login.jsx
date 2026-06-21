import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Mail, Lock, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      setAuth(data.token, data.userId, data.email, data.displayName);
      navigate(redirectUrl);
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent-glow">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Meet</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent/15 text-accent rounded-md border border-accent/20 tracking-wide uppercase">Beta</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6 sm:mb-7">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-3 mt-1">Sign in to continue</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-2.5 bg-danger-soft border border-danger/20 rounded-xl text-danger text-sm animate-[fadeIn_0.2s_ease-out]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-base border border-border-2 rounded-xl pl-10 pr-4 py-3 text-white placeholder-text-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-base border border-border-2 rounded-xl pl-10 pr-4 py-3 text-white placeholder-text-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white text-sm transition-all duration-200 shadow-lg shadow-accent-glow active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-text-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors duration-200">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
