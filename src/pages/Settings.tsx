import React, { useState, useEffect, useRef } from 'react';
import { Storage } from '../storage/db';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrations';
import { ImportExport, ImportValidationResult, ImportResult } from '../engines/importExport';
import { auditDataIntegrity, IntegrityReport, IntegrityFinding } from '../engines/integrity';
import { initializeDatabase } from '../utils/initDb';
import { CANONICAL_30_TAGS } from '../data/canonicalTags';
import ReconciliationPanel from '../components/ReconciliationPanel';
import { 
  Download, 
  Upload, 
  DatabaseZap, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  RefreshCw, 
  CheckCircle2, 
  Layers,
  FolderTree,
  ChevronDown,
  ChevronRight,
  FileCheck
} from 'lucide-react';

export default function Settings() {
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  // Data Health & Integrity State
  const [healthLoading, setHealthLoading] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [showFindings, setShowFindings] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  
  // Import State
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    videos: 0,
    sessions: 0,
    performers: 0,
    tags: 0,
    watchlist: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setHealthLoading(true);
    try {
      const all = await Storage.getAllData();
      setStats({
        videos: all.videos.length,
        sessions: all.sessions.length,
        performers: all.performers.length,
        tags: all.tags.length,
        watchlist: all.watchlist.length
      });
      const report = auditDataIntegrity({
        videos: all.videos,
        sessions: all.sessions,
        performers: all.performers,
        tags: all.tags,
        watchlist: all.watchlist,
        settings: all.settings
      });
      setIntegrityReport(report);
    } catch (err) {
      console.error('Failed to load integrity report:', err);
    } finally {
      setHealthLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      const dataStr = await ImportExport.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `t9-registry-export-v${CURRENT_SCHEMA_VERSION}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg({ text: 'Canonical export JSON created successfully.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMsg({ text: `Export failed: ${err.message || err}`, type: 'error' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setImportFileContent(content);
      const validation = ImportExport.validateImportData(content);
      setValidationResult(validation);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (!validationResult || !validationResult.normalizedData) return;

    if (importMode === 'replace') {
      const confirmed = window.confirm(
        'WARNING: "Replace" mode will completely clear existing local videos, sessions, and tags before restoring from backup. Proceed?'
      );
      if (!confirmed) return;
    }

    setIsImporting(true);
    try {
      let result: ImportResult;
      if (importMode === 'replace') {
        result = await ImportExport.importReplace(validationResult.normalizedData);
      } else {
        result = await ImportExport.importMerge(validationResult.normalizedData);
      }
      setImportResult(result);
      setMsg({ 
        text: `Import completed (${result.mode.toUpperCase()} mode): ${result.stats.videosAdded} videos added, ${result.stats.videosUpdated} updated, ${result.stats.sessionsAdded} sessions recorded.`,
        type: 'success'
      });
      // Reset file input & refresh data
      setImportFileContent(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err: any) {
      console.error(err);
      setMsg({ text: `Import failed: ${err.message || err}`, type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSeed = async () => {
    try {
      await initializeDatabase();
      await loadData();
      setMsg({ text: 'Database seed process completed. Canonical tags and sample catalog seeded if empty.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMsg({ text: `Seed process failed: ${err.message || err}`, type: 'error' });
    }
  };

  const filteredFindings = (integrityReport?.findings || []).filter(f => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  // Group Canonical Tags by category
  const tagsByCategory: Record<string, typeof CANONICAL_30_TAGS> = {};
  CANONICAL_30_TAGS.forEach(t => {
    if (!tagsByCategory[t.category]) tagsByCategory[t.category] = [];
    tagsByCategory[t.category].push(t);
  });

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div>
        <h2 className="text-2xl font-bold">Registry Settings & Data Health</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Schema Version {CURRENT_SCHEMA_VERSION} · Relational Reconciliation · Portable Storage Layer
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          msg.type === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-300' :
          msg.type === 'warning' ? 'bg-amber-950/30 border-amber-900/50 text-amber-300' :
          'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
        }`}>
          <p className="text-sm">{msg.text}</p>
          <button onClick={() => setMsg(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* 1. DATA HEALTH & INTEGRITY SECTION */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              !integrityReport ? 'bg-neutral-800 text-neutral-400' :
              integrityReport.summary.errors > 0 ? 'bg-red-950/60 text-red-400 border border-red-900/40' :
              integrityReport.summary.warnings > 0 ? 'bg-amber-950/60 text-amber-400 border border-amber-900/40' :
              'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
            }`}>
              {integrityReport?.summary.errors ? (
                <AlertOctagon size={22} />
              ) : integrityReport?.summary.warnings ? (
                <AlertTriangle size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Data Integrity Audit
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  !integrityReport ? 'bg-neutral-800 text-neutral-400' :
                  integrityReport.summary.errors > 0 ? 'bg-red-900/40 text-red-300 border border-red-800' :
                  integrityReport.summary.warnings > 0 ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                  'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                }`}>
                  {!integrityReport ? 'Unknown' : integrityReport.summary.errors > 0 ? 'Errors Detected' : integrityReport.summary.warnings > 0 ? 'Warnings Found' : 'Clean & Reconciled'}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Evaluates stable IDs, relational references, canonical vocabularies, and collection paths.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={healthLoading}
            className="flex items-center gap-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 rounded-lg transition-colors border border-neutral-700/60"
          >
            <RefreshCw size={13} className={healthLoading ? 'animate-spin' : ''} />
            Run Integrity Audit
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg">
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Videos</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.videos}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg">
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Sessions</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.sessions}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg">
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Performers</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.performers}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg">
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Tags</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.tags}</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-lg">
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Watchlist</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.watchlist}</div>
          </div>
        </div>

        {/* Summary counts */}
        {integrityReport && (
          <div className="flex flex-wrap items-center justify-between pt-1 gap-2 text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                {integrityReport.summary.errors} Errors
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {integrityReport.summary.warnings} Warnings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                {integrityReport.summary.info} Informational
              </span>
            </div>

            <button
              onClick={() => setShowFindings(!showFindings)}
              className="flex items-center gap-1 text-neutral-300 hover:text-white font-medium transition-colors"
            >
              {showFindings ? 'Hide Detailed Findings' : 'Inspect Detailed Findings'}
              {showFindings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        )}

        {/* Detailed Findings Drawer */}
        {showFindings && integrityReport && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3 mt-2">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-medium text-neutral-400">Filter findings by severity:</span>
              <div className="flex items-center gap-1">
                {(['all', 'error', 'warning', 'info'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`text-xs px-2.5 py-1 rounded transition-colors ${
                      severityFilter === sev
                        ? 'bg-neutral-800 text-white font-medium'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">
                No findings match the selected filter.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredFindings.map(f => (
                  <div 
                    key={f.id} 
                    className={`p-2.5 rounded text-xs border flex items-start gap-2.5 ${
                      f.severity === 'error' ? 'bg-red-950/20 border-red-900/40 text-red-200' :
                      f.severity === 'warning' ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' :
                      'bg-neutral-900/40 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      f.severity === 'error' ? 'bg-red-900/60 text-red-200' :
                      f.severity === 'warning' ? 'bg-amber-900/60 text-amber-200' :
                      'bg-neutral-800 text-neutral-400'
                    }`}>
                      {f.category}
                    </span>
                    <div className="flex-1">
                      <p>{f.message}</p>
                      {f.entityId && (
                        <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Entity: {f.entityId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. REAL COLLECTION INGESTION & RECONCILIATION */}
      <ReconciliationPanel onCommitted={loadData} />

      {/* 3. BACKUP, RESTORE & DATA PORTABILITY SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-neutral-200">
                <Download size={20} />
              </div>
              <div>
                <h3 className="font-medium text-base text-white">Canonical JSON Export</h3>
                <p className="text-xs text-neutral-400">Schema Version {CURRENT_SCHEMA_VERSION} Portability</p>
              </div>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Export your complete relational metadata, performer associations, canonical tags, logged sessions, and watchlist state into a single self-contained JSON file.
            </p>
          </div>

          <button 
            onClick={handleExport}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-neutral-700/50"
          >
            <Download size={14} />
            Export Registry JSON
          </button>
        </div>

        {/* Initial Seed Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-neutral-200">
                <DatabaseZap size={20} />
              </div>
              <div>
                <h3 className="font-medium text-base text-white">Database Seed Script</h3>
                <p className="text-xs text-neutral-400">Canonical 30 Tags & Physical Catalog</p>
              </div>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Populates canonical tags and parses the sample file catalog if the local registry is unpopulated. Non-destructive; will not overwrite existing records.
            </p>
          </div>

          <button 
            onClick={handleSeed}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-neutral-700/50"
          >
            <DatabaseZap size={14} />
            Run Seed Script
          </button>
        </div>
      </div>

      {/* 3. ROBUST IMPORT PIPELINE WITH PRE-FLIGHT VALIDATION */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <div className="p-2 bg-neutral-800 rounded-lg text-neutral-200">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Import Registry Dataset</h3>
            <p className="text-xs text-neutral-400">Pre-flight validation, version migration, and Merge or Replace semantics</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Select Registry JSON File:
            </label>
            <input 
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer"
            />
          </div>

          {validationResult && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <FileCheck size={14} className={validationResult.isValid ? 'text-emerald-400' : 'text-red-400'} />
                  Pre-flight Validation Result
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  validationResult.canProceed ? 'bg-emerald-950 text-emerald-300 border border-emerald-900' : 'bg-red-950 text-red-300 border border-red-900'
                }`}>
                  {validationResult.canProceed ? 'Valid for Import' : 'Blocked — Errors Found'}
                </span>
              </div>

              {validationResult.normalizedData && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs py-1">
                  <div className="bg-neutral-900 p-2 rounded">
                    <span className="text-neutral-500 block text-[10px]">VIDEOS</span>
                    <span className="font-semibold text-neutral-200">{validationResult.normalizedData.videos.length}</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <span className="text-neutral-500 block text-[10px]">SESSIONS</span>
                    <span className="font-semibold text-neutral-200">{validationResult.normalizedData.sessions.length}</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <span className="text-neutral-500 block text-[10px]">PERFORMERS</span>
                    <span className="font-semibold text-neutral-200">{validationResult.normalizedData.performers.length}</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <span className="text-neutral-500 block text-[10px]">TAGS</span>
                    <span className="font-semibold text-neutral-200">{validationResult.normalizedData.tags.length}</span>
                  </div>
                  <div className="bg-neutral-900 p-2 rounded">
                    <span className="text-neutral-500 block text-[10px]">WATCHLIST</span>
                    <span className="font-semibold text-neutral-200">{validationResult.normalizedData.watchlist.length}</span>
                  </div>
                </div>
              )}

              {/* Warnings / Errors */}
              {validationResult.errors.length > 0 && (
                <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-xs text-red-300 space-y-1">
                  <span className="font-semibold block">Critical Errors:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 space-y-1">
                  <span className="font-semibold block">Warnings & Notices:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import Mode Selection */}
              {validationResult.canProceed && (
                <div className="pt-2 border-t border-neutral-800 space-y-3">
                  <span className="text-xs font-medium text-neutral-300 block">Select Import Semantics:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'merge' 
                        ? 'bg-neutral-900 border-neutral-400 text-white' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="importMode" 
                          value="merge" 
                          checked={importMode === 'merge'} 
                          onChange={() => setImportMode('merge')} 
                          className="accent-neutral-200"
                        />
                        <span className="font-semibold text-xs">Merge Mode (Recommended)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 pl-5">
                        Adds new videos, performers, and sessions. Enriches existing items without deleting local records.
                      </p>
                    </label>

                    <label className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'replace' 
                        ? 'bg-neutral-900 border-red-500 text-white' 
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="importMode" 
                          value="replace" 
                          checked={importMode === 'replace'} 
                          onChange={() => setImportMode('replace')} 
                          className="accent-red-500"
                        />
                        <span className="font-semibold text-xs text-red-400">Replace Mode (Destructive)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 pl-5">
                        Wipes current database completely and replaces it with the imported dataset.
                      </p>
                    </label>
                  </div>

                  <button
                    onClick={executeImport}
                    disabled={isImporting}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                      importMode === 'replace'
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-neutral-200 hover:bg-white text-neutral-900'
                    }`}
                  >
                    <Upload size={14} />
                    {isImporting ? 'Processing Dataset...' : `Execute ${importMode === 'replace' ? 'Replace & Overwrite' : 'Merge Import'}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. CANONICAL 30-TAG VOCABULARY REFERENCE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="border-b border-neutral-800 pb-3">
          <h3 className="font-semibold text-lg text-white">Canonical 30-Tag Vocabulary</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Authoritative four-category taxonomic backbone for the T9 Registry.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Object.entries(tagsByCategory).map(([cat, tags]) => (
            <div key={cat} className="bg-neutral-950 border border-neutral-800/80 p-4 rounded-lg space-y-2">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{cat}</h4>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map(t => (
                  <span 
                    key={t.name}
                    className="text-xs bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PHYSICAL MODEL & VOCABULARIES REFERENCE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg border-b border-neutral-800 pb-2 text-white">Physical Hierarchy & Behavioral Reference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div>
            <h4 className="font-medium text-neutral-300 mb-2 flex items-center gap-1.5">
              <FolderTree size={14} className="text-neutral-500" /> Physical Folders
            </h4>
            <ul className="space-y-1 text-neutral-500">
              <li><span className="text-neutral-300">0 Favorites</span> (Dynamic set)</li>
              <li><span className="text-neutral-300">1 Solo</span> (1 participant)</li>
              <li><span className="text-neutral-300">2 Duo</span> (2 participants)</li>
              <li><span className="text-neutral-300">3 Threesome</span> (3 participants)</li>
              <li><span className="text-neutral-300">4(+) Group</span> (4+ participants)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Session Ratings</h4>
            <ul className="space-y-1 text-neutral-500">
              <li><span className="text-neutral-300">5</span> — Nuclear / ruined me</li>
              <li><span className="text-neutral-300">4</span> — Very strong</li>
              <li><span className="text-neutral-300">3</span> — Solid</li>
              <li><span className="text-neutral-300">2</span> — Meh</li>
              <li><span className="text-neutral-300">1</span> — Why did I bother</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Vibe / Energy</h4>
            <ul className="space-y-1 text-neutral-500">
              <li>Aggressive</li>
              <li>Worship</li>
              <li>Filthy</li>
              <li>Degrading</li>
              <li>Tender</li>
              <li>Chaotic</li>
              <li>Power</li>
              <li>Size-focused</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Orgasm Status</h4>
            <ul className="space-y-1 text-neutral-500">
              <li>Came</li>
              <li>Edged Only</li>
              <li>Both</li>
              <li>Neither</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
