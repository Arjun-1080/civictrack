import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Globe, ArrowRight, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';

const ROLE_HINTS = [
  { email: 'auditor1–5@example.com', role: 'Auditor', color: 'text-violet-700' },
  { email: 'worker1–5@example.com',  role: 'Worker',  color: 'text-amber-700' },
  { email: 'Any other email',        role: 'Citizen', color: 'text-blue-700' },
];

export default function Register() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPw] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { register }            = useContext(AuthContext);
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
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
              Join the civic<br />movement
            </h1>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-xs">
              Register to report issues, track resolution progress, and be a part of transparent local governance.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role assignment</p>
            {ROLE_HINTS.map(h => (
              <div key={h.role} className="flex items-start gap-3">
                <span className={`text-xs font-bold w-14 shrink-0 ${h.color}`}>{h.role}</span>
                <span className="text-xs text-gray-500 font-mono leading-snug">{h.email}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Already registered?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>

          {/* Role hint (mobile) */}
          <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Use <span className="font-mono font-semibold">auditor1@example.com</span> or <span className="font-mono font-semibold">worker1@example.com</span> to register with a privileged role. All other emails get Citizen access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="auth-error" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                required
                autoComplete="name"
                className="input-field"
                placeholder="Aarav Singh"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm justify-between"
            >
              <span>{loading ? 'Creating account…' : 'Create account'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
