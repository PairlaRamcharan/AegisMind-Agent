import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import HoneypotManager from '../components/HoneypotManager';
import { quarantineApi, settingsApi } from '../services/api';

export default function Quarantine() {
  const [quarantineList, setQuarantineList] = useState([]);
  const [currentStrategy, setCurrentStrategy] = useState('FAKE_DATA');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, sRes] = await Promise.all([
        quarantineApi.getList(),
        settingsApi.getSettings()
      ]);
      setQuarantineList(qRes.data.quarantineList || []);
      setCurrentStrategy(sRes.data.honeypotStrategy || 'FAKE_DATA');
    } catch (err) {
      console.error('Failed to fetch quarantine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStrategy = async (strategy) => {
    try {
      setCurrentStrategy(strategy);
      const settings = await settingsApi.getSettings();
      await settingsApi.updateSettings({
        ...settings.data,
        honeypotStrategy: strategy
      });
    } catch (err) {
      console.error('Failed to update strategy:', err);
    }
  };

  const handleReleaseIp = async (id) => {
    try {
      await quarantineApi.release(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to release IP:', err);
    }
  };

  const handleIsolateIp = async (data) => {
    try {
      await quarantineApi.isolate(data);
      await fetchData();
    } catch (err) {
      console.error('Failed to isolate IP:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <span>ATTACKER HONEYPOT MANAGER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic isolation, honeypot response strategy & active attacker blocklist
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-mono font-semibold flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Honeypot Component */}
      <HoneypotManager
        quarantineList={quarantineList}
        currentStrategy={currentStrategy}
        onUpdateStrategy={handleUpdateStrategy}
        onReleaseIp={handleReleaseIp}
        onIsolateIp={handleIsolateIp}
      />
    </div>
  );
}
