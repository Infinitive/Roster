import React, { useState } from 'react';
import { 
  previewIngestion, 
  commitReconciledDataset, 
  ReconciliationResult 
} from '../engines/reconciliation';
import { SEED_FILE_LIST } from '../data/seedList';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Upload, 
  FolderTree, 
  Tag, 
  Users, 
  ShieldAlert, 
  FileCheck,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

interface ReconciliationPanelProps {
  onCommitted: () => void;
}

export default function ReconciliationPanel({ onCommitted }: ReconciliationPanelProps) {
  const [rawText, setRawText] = useState('');
  const [previewResult, setPreviewResult] = useState<ReconciliationResult | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'physical' | 'performers' | 'tags' | 'quality' | null>('physical');

  const handleLoadSampleFixture = () => {
    setRawText(SEED_FILE_LIST.join('\n'));
    setPreviewResult(null);
    setCommitMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setRawText(content);
      setPreviewResult(null);
      setCommitMessage(null);
    };
    reader.readAsText(file);
  };

  const handleRunReconciliation = () => {
    if (!rawText.trim()) return;
    const res = previewIngestion(rawText, 'real');
    setPreviewResult(res);
    setCommitMessage(null);
  };

  const handleExecuteCommit = async () => {
    if (!previewResult) return;
    const count = previewResult.videos.length;
    const confirmed = window.confirm(
      `Commit ${count} reconciled video records to the registry? Existing sessions and custom notes will be preserved.`
    );
    if (!confirmed) return;

    setIsCommitting(true);
    try {
      const stats = await commitReconciledDataset(previewResult);
      setCommitMessage(
        `Successfully committed ${stats.videosSaved} videos, ${stats.performersSaved} new performers, and ${stats.tagsSaved} new custom tags. Provenance recorded.`
      );
      onCommitted();
    } catch (err: any) {
      console.error('Commit failed:', err);
      alert(`Commit failed: ${err.message || err}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const report = previewResult?.report;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="font-semibold text-lg text-white flex items-center gap-2">
            <Layers size={18} className="text-neutral-400" />
            Physical Collection Ingestion & Pre-Commit Reconciliation
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic ingestion pipeline · Conservative 30-tag taxonomy · Provenance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadSampleFixture}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Load Representative Fixture ({SEED_FILE_LIST.length})
          </button>
        </div>
      </div>

      {/* Section 44 Compliance Banner */}
      <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-start gap-3 text-xs text-neutral-400">
        <Info size={16} className="text-neutral-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-neutral-200">Authoritative Inventory Notice:</span> The authoritative 271-record physical inventory file is not yet committed to this repository. The application will not fabricate data. Paste or upload the complete inventory file below, or use the representative fixture to verify the ingestion, reconciliation, duplicate detection, and pre-commit reporting pipeline.
        </div>
      </div>

      {commitMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{commitMessage}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <label className="text-neutral-300 font-medium">Physical Inventory Paths (One per line)</label>
          <label className="text-neutral-400 hover:text-white cursor-pointer flex items-center gap-1">
            <Upload size={13} />
            <span>Upload .txt File</span>
            <input 
              type="file" 
              accept=".txt,.csv,.json" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setPreviewResult(null);
          }}
          placeholder="Paste lines, e.g.:&#10;John's T9/XXX/0 Favorites/Bolatino | Two Latinos Fuck a Twink | Latino, Twink, Group, Brazilian [720p]&#10;John's T9/XXX/2/Hard & Rough / Intense/Clay Maverick | White Trash Rough | Rough, Hunk [HD]"
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-y"
        />

        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-neutral-500">
            {rawText.trim() ? `${rawText.trim().split('\n').filter(Boolean).length} line(s) loaded` : 'No inventory loaded'}
          </span>
          <button
            type="button"
            onClick={handleRunReconciliation}
            disabled={!rawText.trim()}
            className="px-4 py-2 bg-neutral-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileCheck size={14} />
            Generate Pre-Commit Reconciliation Report
          </button>
        </div>
      </div>

      {/* Reconciliation Report Preview */}
      {report && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-800/80 pb-4">
            <div>
              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                <FileText size={16} className="text-neutral-400" />
                Pre-Commit Reconciliation Report
              </h4>
              <p className="text-xs text-neutral-500 mt-0.5">Dry-run preview · Zero storage modifications</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded text-neutral-300 font-medium">
                {report.collection.candidateCount} Valid Candidates
              </span>
              {report.collection.duplicateCandidateCount > 0 && (
                <span className="text-xs bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded text-amber-300 font-medium">
                  {report.collection.duplicateCandidateCount} Duplicate Candidates
                </span>
              )}
            </div>
          </div>

          {/* High-level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <span className="text-neutral-500 block">Total Ingested Lines</span>
              <span className="text-base font-semibold text-white mt-1 block">{report.collection.sourceRecordCount}</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <span className="text-neutral-500 block">Normalized Performers</span>
              <span className="text-base font-semibold text-white mt-1 block">{report.performers.uniqueNormalizedPerformers}</span>
              <span className="text-[10px] text-neutral-500">{report.performers.unknownPerformerCount} unknown</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <span className="text-neutral-500 block">Canonical Tag Matches</span>
              <span className="text-base font-semibold text-white mt-1 block">
                {(Object.values(report.tags.canonicalTagMatches) as number[]).reduce((a: number, b: number) => a + b, 0)}
              </span>
              <span className="text-[10px] text-neutral-500">{report.tags.customTagCount} custom</span>
            </div>
            <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-lg">
              <span className="text-neutral-500 block">Research Needed</span>
              <span className="text-base font-semibold text-amber-400 mt-1 block">{report.titles.researchNeededCount}</span>
              <span className="text-[10px] text-neutral-500">{report.tags.uncertainTagCount} uncertain tags</span>
            </div>
          </div>

          {/* Collapsible Accordions for Detailed Auditing */}
          <div className="space-y-3 pt-2">
            {/* 1. Physical Distribution */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'physical' ? null : 'physical')}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/80 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <FolderTree size={14} className="text-neutral-400" />
                  Physical Folder & Resolution Distribution
                </span>
                {expandedSection === 'physical' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSection === 'physical' && (
                <div className="p-4 bg-neutral-950 space-y-4 text-xs">
                  <div>
                    <h5 className="font-medium text-neutral-400 mb-2">Folder Distribution</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(report.physical.folderDistribution).map(([folder, count]) => (
                        <div key={folder} className="bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded flex justify-between">
                          <span className="text-neutral-300 truncate">{folder}</span>
                          <span className="text-neutral-400 font-mono ml-2">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-neutral-400 mb-2">Resolution Distribution</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(report.physical.resolutionDistribution).map(([res, count]) => (
                        <span key={res} className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded text-neutral-300">
                          {res}: <strong className="text-white">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Performers Reconciliation */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'performers' ? null : 'performers')}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/80 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-neutral-400" />
                  Performer Reconciliation ({report.performers.uniqueNormalizedPerformers} entities)
                </span>
                {expandedSection === 'performers' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSection === 'performers' && (
                <div className="p-4 bg-neutral-950 text-xs space-y-3">
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2">
                    {report.performers.performers.map((p) => (
                      <span key={p.id} className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Tags Reconciliation */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'tags' ? null : 'tags')}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/80 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Tag size={14} className="text-neutral-400" />
                  Conservative Tag Reconciliation
                </span>
                {expandedSection === 'tags' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSection === 'tags' && (
                <div className="p-4 bg-neutral-950 text-xs space-y-4">
                  <div>
                    <h5 className="font-medium text-neutral-400 mb-2">Canonical Tag Matches</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(report.tags.canonicalTagMatches).map(([tag, count]) => (
                        <span key={tag} className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                          {tag} <span className="text-neutral-500 font-mono">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {report.tags.uncertainTags.length > 0 && (
                    <div>
                      <h5 className="font-medium text-amber-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        Uncertain / Ambiguous Words Held as Raw (Not Forced into Canonical)
                      </h5>
                      <div className="space-y-1">
                        {report.tags.uncertainTags.map((ut, idx) => (
                          <div key={idx} className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded">
                            <span className="font-mono text-amber-300">"{ut.raw}"</span>: {ut.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Data Quality & Mismatches */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'quality' ? null : 'quality')}
                className="w-full flex items-center justify-between p-3 bg-neutral-900/80 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-neutral-400" />
                  Data Quality, Mismatches & Duplicate Warnings ({report.dataQuality.participantFolderMismatches.length + report.dataQuality.duplicateCandidates.length})
                </span>
                {expandedSection === 'quality' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSection === 'quality' && (
                <div className="p-4 bg-neutral-950 text-xs space-y-4">
                  {report.dataQuality.duplicateCandidates.length > 0 ? (
                    <div className="space-y-2">
                      <h5 className="font-medium text-amber-400">Duplicate Candidates</h5>
                      {report.dataQuality.duplicateCandidates.map((dup, i) => (
                        <div key={i} className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px]">
                          <span className="font-semibold uppercase tracking-wider">{dup.type}</span>: {dup.message}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500">No duplicate paths, filenames, or performer/title collisions found.</p>
                  )}

                  {report.dataQuality.participantFolderMismatches.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="font-medium text-amber-400">Participant Count vs Folder Mismatches</h5>
                      {report.dataQuality.participantFolderMismatches.map((m, i) => (
                        <div key={i} className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] space-y-1">
                          <p className="text-neutral-300 font-medium truncate">{m.filename}</p>
                          <p className="text-neutral-500">{m.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-neutral-800">
                    <h5 className="font-medium text-neutral-400 mb-1">Provenance Tracking</h5>
                    <p className="text-[11px] text-neutral-500">
                      All {report.dataQuality.provenanceCounts.parsed} imported records will have their fields assigned to provenance level: <span className="font-mono text-neutral-300">parsed (source: filename)</span>. User confirmations and external research remain distinct.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Commit Action Button */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs text-neutral-500">
              No sessions will be created. Watchlist will remain untouched.
            </div>
            <button
              type="button"
              onClick={handleExecuteCommit}
              disabled={isCommitting || report.collection.candidateCount === 0}
              className="px-5 py-2.5 bg-neutral-200 hover:bg-white text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
            >
              <CheckCircle2 size={15} />
              {isCommitting ? 'Committing to Registry...' : `Commit ${report.collection.candidateCount} Videos to Registry`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
