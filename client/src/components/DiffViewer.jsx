import React, { useState } from 'react';
import { Columns, List, Check, Copy } from 'lucide-react';

export default function DiffViewer({ originalCode, patchedCode, diffContent }) {
  const [viewMode, setViewMode] = useState('UNIFIED'); // UNIFIED | SIDE_BY_SIDE
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patchedCode || diffContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffLines = (diffContent || '').split('\n');

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs">
      {/* Diff Header Controls */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-200">AST Code Diff Inspection</span>
          <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
            UNIFIED GIT DIFF
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setViewMode('UNIFIED')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 ${
                viewMode === 'UNIFIED' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('SIDE_BY_SIDE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 ${
                viewMode === 'SIDE_BY_SIDE' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Fix'}</span>
          </button>
        </div>
      </div>

      {/* Diff Output */}
      {viewMode === 'UNIFIED' ? (
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-96">
          <pre className="space-y-0.5">
            {diffLines.map((line, idx) => {
              let lineStyle = 'text-slate-300';
              if (line.startsWith('+') && !line.startsWith('+++')) {
                lineStyle = 'bg-emerald-950/40 text-emerald-400 border-l-2 border-emerald-500 pl-2 font-semibold';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                lineStyle = 'bg-rose-950/40 text-rose-400 border-l-2 border-rose-500 pl-2 line-through opacity-80';
              } else if (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++')) {
                lineStyle = 'text-slate-500 font-bold';
              }

              return (
                <div key={idx} className={`py-0.5 ${lineStyle}`}>
                  {line || ' '}
                </div>
              );
            })}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-slate-800">
          <div className="p-4 bg-slate-950 max-h-96 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-rose-400 mb-2 border-b border-slate-800 pb-1">
              Vulnerable Legacy Code
            </div>
            <pre className="text-rose-300/90 whitespace-pre-wrap leading-relaxed text-[11px]">
              {originalCode || '// Original code unavailable'}
            </pre>
          </div>
          <div className="p-4 bg-slate-950 max-h-96 overflow-y-auto border-l border-slate-800">
            <div className="text-[10px] uppercase font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">
              AI Security Patched Code
            </div>
            <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed text-[11px]">
              {patchedCode || '// Patched code snippet'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
