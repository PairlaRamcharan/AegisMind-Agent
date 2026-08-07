import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import TelemetryTable from '../components/TelemetryTable';
import { telemetryApi } from '../services/api';

export default function Telemetry() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customIp, setCustomIp] = useState('203.0.113.88');
  const [customEndpoint, setCustomEndpoint] = useState('/api/v1/auth/login');
  const [customPayload, setCustomPayload] = useState('{"username": "admin\' UNION SELECT * FROM users --"}');
  const [ingestStatus, setIngestStatus] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await telemetryApi.getLogs({ limit: 100 });
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch telemetry logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCustomIngest = async (e) => {
    e.preventDefault();
    setIngestStatus(null);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(customPayload);
      } catch (err) {
        parsed = { raw: customPayload };
      }

      const res = await telemetryApi.ingest({
        ip_address: customIp,
        method: 'POST',
        endpoint: customEndpoint,
        headers: { 'user-agent': 'Manual Telemetry Probe v2.5' },
        payload: parsed
      });

      setIngestStatus(res.data);
      fetchLogs();
    } catch (err) {
      setIngestStatus({ error: err.response?.data?.error || err.message });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>LIVE TRAFFIC TELEMETRY INTERCEPTOR</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time payload inspection, headers stream & AI threat classification
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-mono font-semibold flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stream</span>
        </button>
      </div>

      {/* Telemetry Logs Table Component */}
      <TelemetryTable logs={logs} onRefresh={fetchLogs} />

      {/* Manual Custom Payload Tester */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
          <Send className="w-4 h-4 text-cyan-400" />
          <span>Inject Custom HTTP Telemetry Payload</span>
        </h2>

        <form onSubmit={handleCustomIngest} className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Source IP Address</label>
            <input
              type="text"
              required
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Target Endpoint</label>
            <input
              type="text"
              required
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">JSON Payload Body</label>
            <input
              type="text"
              required
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg"
            >
              <span>Transmit Payload to AegisInterceptor</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {ingestStatus && (
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 text-xs font-mono">
            {ingestStatus.error ? (
              <span className="text-rose-400 font-bold">Ingest Error: {ingestStatus.error}</span>
            ) : (
              <div className="space-y-1 text-slate-300">
                <div className="text-cyan-400 font-bold">Interception Result ({ingestStatus.latencyMs}ms):</div>
                <div>Category: <span className="text-rose-400 font-bold">{ingestStatus.analysis.threatCategory}</span> | Risk: {ingestStatus.analysis.riskLevel}</div>
                <div>Auto-Quarantined: <span className="text-emerald-400 font-bold">{ingestStatus.analysis.autoIsolated ? 'YES' : 'NO'}</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
