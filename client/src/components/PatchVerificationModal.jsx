import React from 'react';
import { Terminal, CheckCircle2, XCircle, ShieldCheck, X } from 'lucide-react';

export default function PatchVerificationModal({ isOpen, onClose, verificationResult, vulnerability }) {
  if (!isOpen || !verificationResult) return null;

  const { status, output, passedCount = 0, totalCount = 3 } = verificationResult;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-mono font-bold text-white">
                Sandboxed Patch Verification Runner
              </h3>
              <p className="text-[11px] text-slate-400">Target Vulnerability: {vulnerability?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            status === 'PASSED'
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40 glow-cyan'
              : 'bg-rose-950/30 text-rose-400 border-rose-500/40 glow-red'
          }`}>
            <div className="flex items-center space-x-3">
              {status === 'PASSED' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <div className="font-extrabold text-sm tracking-wide">
                  VERIFICATION STATUS: {status === 'PASSED' ? 'PASSED 100%' : 'EXPLOIT RESIDUAL RISK'}
                </div>
                <div className="text-[11px] text-slate-300">
                  {passedCount} of {totalCount} simulated exploit injection tests neutralized.
                </div>
              </div>
            </div>

            <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
              status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {status}
            </span>
          </div>

          {/* Execution Log Terminal Output */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
              <span>Sandbox Test Runner Standard Output (stdout):</span>
              <span className="text-[10px] text-cyan-400">ISOLATED VM ENVIRONMENT</span>
            </div>
            <pre className="p-4 bg-slate-950 text-cyan-300 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed">
              {output || '[SANDBOX RUNNER] Awaiting execution trigger...'}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Close Runner Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
