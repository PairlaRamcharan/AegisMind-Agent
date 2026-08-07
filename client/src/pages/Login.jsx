import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('analyst@aegismind.io');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState('ANALYST');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await authApi.register({ email, password, role });
      } else {
        res = await authApi.login({ email, password });
      }

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication attempt failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-cyan-500/30 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-2xl mb-3 shadow-lg glow-cyan">
            <Shield className="w-8 h-8 text-cyan-400 animate-pulse-slow" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wider">
            AEGIS<span className="text-cyan-400">MIND</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trust Cyber Defense & Remediation Platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">SOC Analyst Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                placeholder="analyst@aegismind.io"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold">Analyst Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ANALYST">SOC ANALYST</option>
                <option value="ADMIN">SYSTEM ADMIN</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition-all"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create SOC Account' : 'Authenticate Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono underline"
          >
            {isRegister ? 'Already registered? Sign in here' : 'Need new SOC credentials? Register account'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
          Demo Default Credentials: <span className="text-cyan-400">analyst@aegismind.io</span> / <span className="text-cyan-400">Password123!</span>
        </div>
      </div>
    </div>
  );
}
