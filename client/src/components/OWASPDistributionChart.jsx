import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981', '#ec4899'];

export default function OWASPDistributionChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'SQL Injection', value: 42 },
    { name: 'Command Injection', value: 25 },
    { name: 'XSS', value: 18 },
    { name: 'IDOR', value: 10 },
    { name: 'SSRF', value: 5 }
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800">
      <div className="mb-4">
        <h3 className="text-base font-bold text-white tracking-wide">OWASP Vector Distribution</h3>
        <p className="text-xs text-slate-400">Categorized by Gemini 2.5 AI semantic engine</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
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
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
