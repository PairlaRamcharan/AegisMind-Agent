import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Lock, Wrench, Settings, AlertTriangle } from 'lucide-react';

const navItems = [
  { name: 'SOC Command', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Telemetry', path: '/telemetry', icon: Radio },
  { name: 'Quarantine Honeypot', path: '/quarantine', icon: Lock },
  { name: 'AI Code Remediation', path: '/remediation', icon: Wrench },
  { name: 'Platform Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ threatCount = 0 }) {
  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div className="px-3 py-2 text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
          Navigation Control
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/30 shadow-md font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.path === '/telemetry' && threatCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full animate-pulse">
                    {threatCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Security Status Box */}
      <div className="p-3.5 glass-card rounded-xl border border-cyan-500/20 bg-slate-900/40">
        <div className="flex items-center space-x-2 text-cyan-400 mb-1.5">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold">AUTONOMOUS AGENT</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gemini 2.5 AI actively scoring OWASP exploit payloads & dispatching AST diff patches.
        </p>
      </div>
    </aside>
  );
}
