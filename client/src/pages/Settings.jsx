import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Key, Sliders, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { settingsApi } from '../services/api';

export default function Settings() {
  const [sensitivityThreshold, setSensitivityThreshold] = useState(0.75);
  const [autopilotMode, setAutopilotMode] = useState(false);
  const [honeypotStrategy, setHoneypotStrategy] = useState('FAKE_DATA');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiApiKeyMasked, setGeminiApiKeyMasked] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await settingsApi.getSettings();
        const s = res.data;
        setSensitivityThreshold(s.sensitivityThreshold ?? 0.75);
        setAutopilotMode(Boolean(s.autopilotMode));
        setHoneypotStrategy(s.honeypotStrategy || 'FAKE_DATA');
        setGeminiApiKey(s.geminiApiKey || '');
        setGeminiApiKeyMasked(s.geminiApiKeyMasked || '');
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await settingsApi.updateSettings({
        sensitivityThreshold,
        autopilotMode,
        honeypotStrategy,
        geminiApiKey
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <span>PLATFORM & AI CONFIGURATION</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sensitivity threshold tuning, autopilot enforcement & Gemini API secrets
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sensitivity Threshold Slider */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>AI Sensitivity Threshold Slider</span>
            </label>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 rounded-lg text-sm">
              {sensitivityThreshold.toFixed(2)}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Requests scoring higher than this confidence score trigger automated IP quarantine. Lowering increases defensive sensitivity; raising requires higher certainty.
          </p>
          <input
            type="range"
            min="0.10"
            max="0.99"
            step="0.05"
            value={sensitivityThreshold}
            onChange={(e) => setSensitivityThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.10 (High Sensitivity / Ultra Strict)</span>
            <span>0.50</span>
            <span>0.75 (Default)</span>
            <span>0.99 (Low Sensitivity / High Precision)</span>
          </div>
        </div>

        {/* Autopilot Mode Toggle */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div>
            <div className="font-bold text-white flex items-center space-x-2">
              {autopilotMode ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
              <span>Autopilot Enforcement Mode</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1 max-w-xl">
              {autopilotMode
                ? '⚡ AUTONOMOUS: AI automatically merges verified AST code patches if sandbox exploit tests pass 100%.'
                : '🛡️ MANUAL APPROVAL: AI generates diff patches; SOC Analyst must explicitly approve and apply fix.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAutopilotMode(!autopilotMode)}
            className={`px-4 py-2 rounded-xl font-bold transition-all border ${
              autopilotMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-cyan'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {autopilotMode ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Honeypot Response Strategy Selector */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3 font-mono text-xs">
          <label className="font-bold text-white block">Default Honeypot Response Strategy</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'FAKE_DATA', title: 'FAKE_DATA', desc: 'Returns realistic decoy database records & mock API secrets' },
              { id: 'TARPIT', title: 'TARPIT', desc: 'Induces artificial progressive delays (2s - 5s)' },
              { id: 'MIRROR', title: 'MIRROR', desc: 'Echoes payload with simulated backend virtual commits' }
            ].map((strat) => (
              <div
                key={strat.id}
                onClick={() => setHoneypotStrategy(strat.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  honeypotStrategy === strat.id
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/40'
                }`}
              >
                <div className="font-bold text-cyan-300 mb-1">{strat.title}</div>
                <div className="text-[11px] text-slate-400">{strat.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini API Key Configuration */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3 font-mono text-xs">
          <label className="font-bold text-white flex items-center space-x-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Google Gemini AI API Key (`@google/genai`)</span>
          </label>
          <p className="text-slate-400 text-[11px]">
            Required for semantic classification (`gemini-2.5-flash`) and AST code patch generation (`gemini-2.5-pro`).
          </p>
          <input
            type="password"
            placeholder={geminiApiKeyMasked ? `Currently configured: ${geminiApiKeyMasked}` : 'Enter your GEMINI_API_KEY...'}
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg transition-all"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Save Platform Configurations</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
