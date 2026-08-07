import React from 'react';

export default function MetricCard({ title, value, subtext, trend, icon: Icon, color = 'cyan' }) {
  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'glow-cyan'
    },
    rose: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'glow-red'
    },
    amber: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: ''
    },
    emerald: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: ''
    }
  };

  const style = colorStyles[color] || colorStyles.cyan;

  return (
    <div className={`glass-card p-5 rounded-2xl border ${style.border} ${style.glow} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border border-slate-800 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
            trend.startsWith('+') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-400">
          {subtext}
        </p>
      )}
    </div>
  );
}
