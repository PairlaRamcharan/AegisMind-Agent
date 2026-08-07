import React, { useState, useEffect } from 'react';
import { Wrench, Sparkles, CheckCircle2, Play, Check, ShieldAlert, FileCode } from 'lucide-react';
import DiffViewer from '../components/DiffViewer';
import PatchVerificationModal from '../components/PatchVerificationModal';
import { remediationApi } from '../services/api';

export default function Remediation() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [applying, setApplying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchVulnerabilities = async () => {
    try {
      const res = await remediationApi.getVulnerabilities();
      const vulns = res.data.vulnerabilities || [];
      setVulnerabilities(vulns);
      if (vulns.length > 0 && !selectedVuln) {
        setSelectedVuln(vulns[0]);
      }
    } catch (err) {
      console.error('Failed to fetch vulnerabilities:', err);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
  }, []);

  const handleGeneratePatch = async () => {
    if (!selectedVuln) return;
    try {
      setGenerating(true);
      await remediationApi.generatePatch(selectedVuln.id);
      await fetchVulnerabilities();
      // Update selected reference
      const res = await remediationApi.getVulnerabilities();
      const updated = res.data.vulnerabilities?.find(v => v.id === selectedVuln.id);
      if (updated) setSelectedVuln(updated);
    } catch (err) {
      console.error('Patch generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyPatch = async () => {
    if (!selectedVuln) return;
    try {
      setVerifying(true);
      const res = await remediationApi.verifyPatch(selectedVuln.id);
      setVerificationResult(res.data.result);
      setShowModal(true);
      await fetchVulnerabilities();
    } catch (err) {
      console.error('Patch verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyPatch = async () => {
    if (!selectedVuln?.patch) return;
    try {
      setApplying(true);
      await remediationApi.applyPatch(selectedVuln.patch.id);
      await fetchVulnerabilities();
    } catch (err) {
      console.error('Failed to apply patch:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>AUTOMATED AI CODE REMEDIATION HUB</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AST-level vulnerability diff generation (`gemini-2.5-pro`) & sandboxed test verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vulnerabilities Sidebar List */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="px-2 py-1 text-xs font-mono font-bold text-slate-400 uppercase">
            Active Vulnerability Registry ({vulnerabilities.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 font-mono text-xs">
            {vulnerabilities.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVuln(v)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedVuln?.id === v.id
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-400 text-[11px]">{v.owasp_category}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    v.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    v.status === 'VERIFIED' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="font-bold text-slate-200 text-xs truncate">{v.title}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{v.file_path}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Vulnerability Detail & AST Diff Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {selectedVuln ? (
            <div className="space-y-5">
              <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Vulnerability Focus</span>
                    <h3 className="text-base font-bold text-white">{selectedVuln.title}</h3>
                    <p className="text-xs text-cyan-400">{selectedVuln.file_path}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleGeneratePatch}
                      disabled={generating}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                      <span>{generating ? 'Generating Fix...' : 'Generate AI Patch'}</span>
                    </button>

                    {selectedVuln.patch && (
                      <button
                        onClick={handleVerifyPatch}
                        disabled={verifying}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                      >
                        <Play className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                        <span>Run Sandbox Runner</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Legacy Vulnerable Code Box */}
                <div>
                  <div className="text-slate-400 text-[11px] mb-1">Legacy Vulnerable Code Snippet</div>
                  <pre className="p-3 bg-slate-950 text-rose-300 rounded-xl border border-rose-500/30 overflow-x-auto text-[11px]">
                    {selectedVuln.vulnerable_code}
                  </pre>
                </div>
              </div>

              {/* Diff Viewer Component */}
              {selectedVuln.patch ? (
                <div className="space-y-4">
                  <DiffViewer
                    originalCode={selectedVuln.vulnerable_code}
                    patchedCode={selectedVuln.patch.patched_code}
                    diffContent={selectedVuln.patch.diff_content}
                  />

                  {/* Apply Patch Footer Controls */}
                  <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        Verification Status: <span className={selectedVuln.patch.verification_status === 'PASSED' ? 'text-emerald-400' : 'text-amber-400'}>{selectedVuln.patch.verification_status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {selectedVuln.patch.applied_at ? `Patch applied on ${new Date(selectedVuln.patch.applied_at).toLocaleString()}` : 'Ready for merge to production repository.'}
                      </p>
                    </div>

                    {!selectedVuln.patch.applied_at && (
                      <button
                        onClick={handleApplyPatch}
                        disabled={applying}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg"
                      >
                        <Check className="w-4 h-4" />
                        <span>{applying ? 'Applying...' : 'Apply Verified Patch'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-400 font-mono text-xs italic">
                  Click "Generate AI Patch" to produce an AST-compliant unified git diff using Gemini 2.5 Pro.
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-500 font-mono text-xs">
              Select a vulnerability from the registry to inspect code diffs and launch sandbox tests.
            </div>
          )}
        </div>
      </div>

      {/* Verification Runner Modal Component */}
      <PatchVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        verificationResult={verificationResult}
        vulnerability={selectedVuln}
      />
    </div>
  );
}
