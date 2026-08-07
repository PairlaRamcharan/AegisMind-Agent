import React, { useState } from 'react';
import { Search, Filter, Eye, AlertOctagon, ShieldCheck, ShieldAlert, X } from 'lucide-react';

export default function TelemetryTable({ logs = [], onRefresh }) {
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = logs.filter(log => {
    const matchesRisk = filterRisk === 'ALL' || log.risk_level === filterRisk;
    const matchesSearch =
      log.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.threat_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const getRiskBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-lg">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2.5 py-1 text-xs font-mono font-medium bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-lg">LOW</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">BENIGN</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search IP, endpoint, or threat vector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
              <option value="BENIGN">BENIGN</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredLogs.length}</span> of {logs.length} telemetry logs
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Source IP</th>
              <th className="px-4 py-3">Method & Route</th>
              <th className="px-4 py-3">OWASP Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3 text-right">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                  No request telemetry matching specified query filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-cyan-300 font-bold whitespace-nowrap">
                    {log.ip_address}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`mr-2 font-bold ${log.method === 'POST' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {log.method}
                    </span>
                    <span className="text-slate-200">{log.endpoint}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {log.threat_category || 'None'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${log.confidence_score > 0.75 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.round(log.confidence_score * 100)}%` }}
                        />
                      </div>
                      <span>{(log.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getRiskBadge(log.risk_level)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-lg transition-colors flex items-center space-x-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payload Inspector Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-mono font-bold text-white">
                  Telemetry Payload Inspection: {selectedLog.ip_address}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Threat Category</div>
                  <div className="text-sm font-bold text-rose-400">{selectedLog.threat_category}</div>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Confidence Score</div>
                  <div className="text-sm font-bold text-cyan-400">{(selectedLog.confidence_score * 100).toFixed(1)}%</div>
                </div>
              </div>

              {selectedLog.technicalExplanation && (
                <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl">
                  <div className="text-rose-400 font-bold mb-1 text-[11px] uppercase">AI Technical Analysis</div>
                  <p className="text-slate-200 leading-relaxed text-xs">{selectedLog.technicalExplanation}</p>
                </div>
              )}

              <div>
                <div className="text-slate-400 text-[11px] mb-1">Request Payload Data</div>
                <pre className="p-3.5 bg-slate-950 text-cyan-300 rounded-xl border border-slate-800 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-slate-400 text-[11px] mb-1">Request Headers</div>
                <pre className="p-3 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 overflow-x-auto text-[10px]">
                  {JSON.stringify(selectedLog.headers, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
