import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Globe, ArrowRight, AlertCircle } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Auditor',  email: 'auditor1@example.com', password: 'password123', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  { label: 'Worker',   email: 'worker1@example.com',  password: 'password123', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useContext(AuthContext);
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password.');
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gray-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}
        />
        <div className="relative">
          <Link to="/board" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </span>
            CivicTrack
          </Link>
        </div>
        <div className="relative space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white leading-snug">
              Transparent civic<br />issue resolution
            </h1>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-xs">
              Citizens report. Auditors validate. Workers resolve. Every step is logged for full public accountability.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {['Report potholes, streetlights & more', 'Track resolution in real time', 'Immutable public audit trail'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-gray-600">SIH25031 — Government of Jharkhand</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Link to="/board" className="flex items-center gap-2 font-bold text-gray-900 text-lg mb-8">
              <span className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <Globe size={14} className="text-white" />
              </span>
              CivicTrack
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">
              No account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo quick-fill */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Demo accounts</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.label}
                  onClick={() => fillDemo(acc)}
                  className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">Click to pre-fill credentials, then Sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="auth-error" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm justify-between"
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
