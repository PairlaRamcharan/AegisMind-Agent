import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, Plus, RefreshCw, Terminal, CheckCircle } from 'lucide-react';

export default function HoneypotManager({
  quarantineList = [],
  currentStrategy = 'FAKE_DATA',
  onUpdateStrategy,
  onReleaseIp,
  onIsolateIp
}) {
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newCategory, setNewCategory] = useState('SQL Injection');
  const [selectedStrategy, setSelectedStrategy] = useState(currentStrategy);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleIsolateSubmit = (e) => {
    e.preventDefault();
    if (!newIp) return;
    onIsolateIp({
      ip_address: newIp,
      reason: newReason || 'Manual SOC Analyst isolation rule',
      threat_category: newCategory
    });
    setNewIp('');
    setNewReason('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Strategy Control Panel */}
      <div className="glass-card p-5 rounded-2xl border border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>Honeypot Deception Strategy Selector</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose active deception response behavior for quarantined attacker IP sessions
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {['TARPIT', 'FAKE_DATA', 'MIRROR'].map((strategy) => (
              <button
                key={strategy}
                onClick={() => {
                  setSelectedStrategy(strategy);
                  onUpdateStrategy(strategy);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedStrategy === strategy
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg glow-cyan'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {strategy}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Explanations */}
        <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
          {selectedStrategy === 'TARPIT' && '⏱️ TARPIT STRATEGY: Induces progressive 2000ms - 5000ms artificial delays to exhaust attacker automated scanners.'}
          {selectedStrategy === 'FAKE_DATA' && '🎭 FAKE_DATA STRATEGY: Returns realistic decoy JSON databases, mock AWS secret tokens, and fake admin records.'}
          {selectedStrategy === 'MIRROR' && '🪞 MIRROR STRATEGY: Echoes attacker request parameters with simulated virtual backend state commitments.'}
        </div>
      </div>

      {/* Quarantined IP List Header */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Quarantined IP Blocklist</h3>
            <p className="text-xs text-slate-400">Actively trapped malicious actors isolated in honeypots</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Manually Isolate IP</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Quarantined IP</th>
                <th className="px-4 py-3">Vector</th>
                <th className="px-4 py-3">Isolation Reason</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {quarantineList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                    No active quarantined IPs recorded.
                  </td>
                </tr>
              ) : (
                quarantineList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-cyan-300">{item.ip_address}</td>
                    <td className="px-4 py-3 text-amber-400">{item.threat_category}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{item.reason}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(item.quarantined_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full">
                          ACTIVE HONEYPOT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">
                          RELEASED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => onReleaseIp(item.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 rounded-lg transition-colors flex items-center space-x-1 ml-auto"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Release</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Isolate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleIsolateSubmit} className="glass-panel max-w-md w-full p-6 rounded-2xl border border-cyan-500/30 space-y-4">
            <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Manually Quarantine IP Address</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Source IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 198.51.100.99"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Threat Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="SQL Injection">SQL Injection</option>
                  <option value="Command Injection">Command Injection</option>
                  <option value="XSS">XSS</option>
                  <option value="IDOR">IDOR</option>
                  <option value="SSRF">SSRF</option>
                  <option value="Zero-Day Suspicious">Zero-Day Suspicious</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Isolation Justification</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this IP is being isolated..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
              >
                Quarantine Immediately
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
