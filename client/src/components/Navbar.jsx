import React from 'react';
import { Shield, ShieldAlert, User, LogOut, Activity } from 'lucide-react';

export default function Navbar({ user, onLogout, zeroTrustActive = true, onToggleZeroTrust }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      {/* Brand & Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="relative p-2 bg-cyan-950/80 border border-cyan-500/30 rounded-xl shadow-lg glow-cyan">
            <Shield className="w-6 h-6 text-cyan-400 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-wider text-white">
                AEGIS<span className="text-cyan-400">MIND</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                v2.5 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Cyber Defense & Dynamic Remediation Engine
            </p>
          </div>
        </div>

        {/* Zero-Trust Status Badge Toggle */}
        <button
          onClick={onToggleZeroTrust}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono transition-all ${
            zeroTrustActive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${zeroTrustActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span>ZERO-TRUST: {zeroTrustActive ? 'ENFORCING' : 'BYPASS'}</span>
        </button>
      </div>

      {/* User Profile & Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-xs font-mono text-slate-300">SYSTEM: OPERATIONAL</span>
        </div>

        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-200">{user.email}</div>
              <div className="text-[10px] font-mono text-cyan-400">{user.role} SOC ANALYST</div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
