import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Lock, Zap, RefreshCw, Radio, FileCode2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ThreatVelocityChart from '../components/ThreatVelocityChart';
import OWASPDistributionChart from '../components/OWASPDistributionChart';
import { telemetryApi, quarantineApi, remediationApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [quarantineCount, setQuarantineCount] = useState(0);
  const [patchStats, setPatchStats] = useState({ unpatched: 0, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, quarRes, vulnRes] = await Promise.all([
        telemetryApi.getStats(),
        quarantineApi.getList(),
        remediationApi.getVulnerabilities()
      ]);

      setStats(statsRes.data);
      setQuarantineCount(quarRes.data.stats?.activeCount || 0);

      const vulns = vulnRes.data.vulnerabilities || [];
      const unpatched = vulns.filter(v => v.status === 'UNPATCHED').length;
      const verified = vulns.filter(v => v.status === 'VERIFIED' || v.status === 'RESOLVED').length;
      setPatchStats({ unpatched, verified });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunExploit = async (attackType) => {
    try {
      setSimulating(true);
      const res = await telemetryApi.simulateExploit(attackType);
      setSimResult(res.data);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to run exploit simulation:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <span>SOC COMMAND CENTER</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
              REAL-TIME
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous zero-trust telemetry interception & live AI threat isolation status
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-mono font-semibold flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Threat Velocity"
          value={`${stats?.threatVelocity || '0.0'}%`}
          subtext="Detected OWASP exploit ratio"
          trend="+4.2%"
          icon={Radio}
          color="rose"
        />
        <MetricCard
          title="Total Scanned Traffic"
          value={stats?.totalScanned || 0}
          subtext="HTTP payloads evaluated"
          icon={Shield}
          color="cyan"
        />
        <MetricCard
          title="Quarantined Attacker IPs"
          value={quarantineCount}
          subtext="Isolated in dynamic honeypots"
          trend="+1 active"
          icon={Lock}
          color="amber"
        />
        <MetricCard
          title="AI Patch Success Rate"
          value={patchStats.verified + patchStats.unpatched > 0 ? `${Math.round((patchStats.verified / (patchStats.verified + patchStats.unpatched)) * 100)}%` : '100%'}
          subtext={`${patchStats.verified} verified AST diff fixes`}
          icon={FileCode2}
          color="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThreatVelocityChart data={stats?.velocityTimeline || []} />
        </div>
        <div>
          <OWASPDistributionChart data={stats?.owaspDistribution || []} />
        </div>
      </div>

      {/* Interactive Live Exploit Trigger Panel */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>Live Attack Exploit Simulator</span>
            </h2>
            <p className="text-xs text-slate-400">Trigger live exploit payloads against backend routes to test AegisInterceptor & dynamic isolation</p>
          </div>
          {simulating && <span className="text-xs font-mono text-cyan-400 animate-pulse">Running exploit attack vector...</span>}
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { id: 'SQL_INJECTION', label: "Trigger SQL Injection (' UNION SELECT)", color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
            { id: 'COMMAND_INJECTION', label: 'Trigger Command Injection (; cat /etc/passwd)', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
            { id: 'XSS', label: 'Trigger XSS Payload (<script>)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
            { id: 'SSRF', label: 'Trigger SSRF Probe (169.254.169.254)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
            { id: 'IDOR', label: 'Trigger IDOR Path Traversal (../../passwd)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
          ].map((exp) => (
            <button
              key={exp.id}
              disabled={simulating}
              onClick={() => handleRunExploit(exp.id)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold hover:scale-105 transition-all ${exp.color}`}
            >
              {exp.label}
            </button>
          ))}
        </div>

        {simResult && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 font-mono text-xs space-y-2">
            <div className="text-cyan-400 font-bold flex items-center justify-between">
              <span>EXPLOCATION RESPONSE REPORT (IP: {simResult.simulatedIp})</span>
              <span className="text-emerald-400 font-bold">THREAT SCORE: {(simResult.analysis.confidenceScore * 100).toFixed(0)}%</span>
            </div>
            <div className="text-slate-300">OWASP Vector: <span className="text-rose-400">{simResult.analysis.threatCategory}</span></div>
            <p className="text-slate-400 italic text-[11px]">{simResult.analysis.technicalExplanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
