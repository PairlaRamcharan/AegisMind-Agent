import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ThreatVelocityChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { time: '10:00', threats: 12 },
    { time: '10:15', threats: 18 },
    { time: '10:30', threats: 8 },
    { time: '10:45', threats: 24 },
    { time: '11:00', threats: 31 },
    { time: '11:15', threats: 15 },
    { time: '11:30', threats: 22 }
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
            <span>Threat Velocity Timeline</span>
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </h3>
          <p className="text-xs text-slate-400">Interceptions per minute across active endpoints</p>
        </div>
        <div className="px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300">
          LIVE STREAM
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono'
              }}
            />
            <Area
              type="monotone"
              dataKey="threats"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#threatGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
