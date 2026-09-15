import React, { useState, useEffect, useRef } from 'react';
import { Storage } from '../storage/db';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrations';
import { ImportExport, ImportValidationResult, ImportResult } from '../engines/importExport';
import { auditDataIntegrity, IntegrityReport, IntegrityFinding } from '../engines/integrity';
import { initializeDatabase } from '../utils/initDb';
import { PlaybackBridgeSettings, Video } from '../types';
import { getPlaybackSettings, savePlaybackSettings, buildShortcutUrl, DEFAULT_PLAYBACK_SETTINGS } from '../utils/playback';
import ReconciliationPanel from '../components/ReconciliationPanel';
import T9Mark from '../components/ui/T9Mark';
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
  BookOpen,
  Play,
  Settings as SettingsIcon,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function More() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'playback' | 'tools' | 'health' | 'system'>('playback');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Playback Bridge State
  const [playbackConfig, setPlaybackConfig] = useState<PlaybackBridgeSettings>(DEFAULT_PLAYBACK_SETTINGS);
  const [playbackSaved, setPlaybackSaved] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [sampleVideo, setSampleVideo] = useState<Video | null>(null);

  // Data Health & Integrity State
  const [healthLoading, setHealthLoading] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [showFindings, setShowFindings] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  // Import / Export State
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
    watchlist: 0,
    realVideos: 0
  });

  useEffect(() => {
    loadAll();
    // Check hash for direct section navigation (e.g. /settings#playback or /more#health)
    if (location.hash === '#playback') {
      setActiveSection('playback');
    } else if (location.hash === '#health') {
      setActiveSection('health');
    } else if (location.hash === '#tools') {
      setActiveSection('tools');
    } else if (location.hash === '#system') {
      setActiveSection('system');
    }
  }, [location.hash]);

  async function loadAll() {
    setHealthLoading(true);
    try {
      // Load Playback Settings
      const pb = await getPlaybackSettings();
      setPlaybackConfig(pb);

      // Load Collection Data
      const all = await Storage.getAllData();
      const real = all.videos.filter(v => v.datasetType === 'real').length;
      setStats({
        videos: all.videos.length,
        sessions: all.sessions.length,
        performers: all.performers.length,
        tags: all.tags.length,
        watchlist: all.watchlist.length,
        realVideos: real
      });

      if (all.videos.length > 0) {
        setSampleVideo(all.videos[0]);
        setTestUrl(buildShortcutUrl(pb.shortcutName, all.videos[0]));
      }

      // Run Integrity Audit
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
      console.error('Failed to load settings data:', err);
    } finally {
      setHealthLoading(false);
    }
  }

  // Handle Playback Config Updates
  const updatePlayback = async (updates: Partial<PlaybackBridgeSettings>) => {
    const updated = { ...playbackConfig, ...updates };
    setPlaybackConfig(updated);
    await savePlaybackSettings(updated);

    if (sampleVideo) {
      setTestUrl(buildShortcutUrl(updated.shortcutName, sampleVideo));
    }

    setPlaybackSaved(true);
    setTimeout(() => setPlaybackSaved(false), 2000);
  };

  const handleTestShortcut = () => {
    if (!sampleVideo) {
      setMsg({ text: 'No video available to test shortcut.', type: 'warning' });
      return;
    }
    const url = buildShortcutUrl(playbackConfig.shortcutName, sampleVideo);
    window.location.href = url;
    setMsg({ 
      text: `Triggered shortcut "${playbackConfig.shortcutName}" with sample payload: ${sampleVideo.relativePath || sampleVideo.filename}`, 
      type: 'info' 
    });
  };

  const handleResetPlayback = async () => {
    await updatePlayback(DEFAULT_PLAYBACK_SETTINGS);
    setMsg({ text: 'Playback bridge settings reset to defaults.', type: 'info' });
  };

  // Export
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

  // Import
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
      setImportFileContent(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadAll();
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
      await loadAll();
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <T9Mark size={32} variant="signature" />
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
            System & Management
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          More
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
          External playback bridge, field guide, data health audit, and collection backup tools.
        </p>
      </div>

      {/* Field Guide Showcase Banner */}
      <Link
        to="/guide"
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#181d2c] via-[#131622] to-[#0d0f17] border border-amber-500/30 hover:border-amber-500/60 shadow-xl transition-all"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-none group-hover:scale-105 transition-transform">
            <BookOpen size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                T9 Field Guide & Reference
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Authoritative
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Standardized 30-tag dictionary, physical folder hierarchy, session ratings, vibes, and discovery modes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 self-end sm:self-center font-mono">
          <span>Read Guide</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Status Messages */}
      {msg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${
          msg.type === 'error' ? 'bg-red-950/40 border-red-900 text-red-300' :
          msg.type === 'warning' ? 'bg-amber-950/40 border-amber-900 text-amber-300' :
          'bg-emerald-950/40 border-emerald-900 text-emerald-300'
        }`}>
          <p>{msg.text}</p>
          <button onClick={() => setMsg(null)} className="text-xs opacity-70 hover:opacity-100 font-mono ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-800">
        {[
          { id: 'playback', label: 'Playback Bridge', icon: Play },
          { id: 'health', label: 'Catalog Health', icon: ShieldCheck },
          { id: 'tools', label: 'Import & Reconcile', icon: Upload },
          { id: 'system', label: 'Database & Backup', icon: DatabaseZap }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={14} className={active ? 'fill-current' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PLAYBACK BRIDGE */}
      {activeSection === 'playback' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#121520] border border-zinc-800/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Play size={20} className="fill-amber-400/20 translate-x-0.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    iOS Shortcut Playback Bridge
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                      playbackConfig.enabled
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {playbackConfig.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Triggers your preferred external player (e.g. VLC) from your T9 drive on iOS or iPadOS
                  </p>
                </div>
              </div>

              {/* Enable / Disable Toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={playbackConfig.enabled}
                  onChange={(e) => updatePlayback({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2.5 text-xs font-semibold text-zinc-300">
                  {playbackConfig.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  iOS Shortcut Name
                </label>
                <input
                  type="text"
                  value={playbackConfig.shortcutName}
                  onChange={(e) => updatePlayback({ shortcutName: e.target.value })}
                  placeholder="Play in VLC"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="text-[11px] text-zinc-500 block">
                  Must match the exact name of the Shortcut in your iOS Shortcuts app.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  Player App Label
                </label>
                <input
                  type="text"
                  value={playbackConfig.playbackAppName}
                  onChange={(e) => updatePlayback({ playbackAppName: e.target.value })}
                  placeholder="VLC"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="text-[11px] text-zinc-500 block">
                  Display name shown in Play tooltips and notices.
                </span>
              </div>
            </div>

            {/* Test Action Bar */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-zinc-200 block font-mono uppercase">
                    Test Shortcut Launch
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    {sampleVideo 
                      ? `Testing with: ${sampleVideo.relativePath || sampleVideo.filename}`
                      : 'No video loaded to test with.'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestShortcut}
                    disabled={!playbackConfig.enabled || !playbackConfig.shortcutName}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <ExternalLink size={14} />
                    <span>Test Shortcut</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPlayback}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
                    title="Reset to defaults"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {testUrl && (
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 truncate">
                  <span className="truncate">{testUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(testUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="text-zinc-400 hover:text-white p-1"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Step-by-Step Shortcut Guide */}
            <div className="p-5 rounded-2xl bg-[#0f1118] border border-zinc-800/60 space-y-3">
              <span className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider block">
                How to Set Up Your iOS Shortcut (30 Seconds)
              </span>
              <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside leading-relaxed">
                <li>Open the <strong className="text-zinc-200">Shortcuts</strong> app on your iPhone or iPad.</li>
                <li>Tap <strong className="text-zinc-200">+</strong> to create a new Shortcut. Name it exactly <code className="text-amber-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">{playbackConfig.shortcutName || 'Play in VLC'}</code>.</li>
                <li>Add action: <strong className="text-zinc-200">Get text from Shortcut Input</strong>.</li>
                <li>Add action: <strong className="text-zinc-200">File</strong> (or Document Picker) targeting your external T9 drive (path: <code className="text-zinc-300 font-mono">T9 / Shortcut Input</code>).</li>
                <li>Add action: <strong className="text-zinc-200">Open in {playbackConfig.playbackAppName || 'VLC'}</strong>.</li>
                <li>Tap <strong className="text-zinc-200">Done</strong>. Now tap <strong className="text-amber-400">Play</strong> on any video card in T9 Registry to launch it instantly!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CATALOG HEALTH & INTEGRITY */}
      {activeSection === 'health' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#121520] border border-zinc-800/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  !integrityReport ? 'bg-zinc-800 text-zinc-400' :
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
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Data Integrity Audit
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                      !integrityReport ? 'bg-zinc-800 text-zinc-400' :
                      integrityReport.summary.errors > 0 ? 'bg-red-900/40 text-red-300 border border-red-800' :
                      integrityReport.summary.warnings > 0 ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                      'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                    }`}>
                      {!integrityReport ? 'Unknown' : integrityReport.summary.errors > 0 ? 'Errors Detected' : integrityReport.summary.warnings > 0 ? 'Warnings Found' : 'Clean & Reconciled'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Validates stable IDs, relational references, canonical vocabularies, and collection paths
                  </p>
                </div>
              </div>

              <button
                onClick={loadAll}
                disabled={healthLoading}
                className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl transition-colors border border-zinc-700 font-semibold"
              >
                <RefreshCw size={13} className={healthLoading ? 'animate-spin' : ''} />
                <span>Audit Registry</span>
              </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Total Videos</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{stats.videos}</div>
                {stats.realVideos > 0 && <span className="text-[10px] text-blue-400 font-mono">({stats.realVideos} real)</span>}
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Sessions</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{stats.sessions}</div>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Performers</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{stats.performers}</div>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Tags</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{stats.tags}</div>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl">
                <div className="text-[10px] text-zinc-500 uppercase font-mono">Watchlist</div>
                <div className="text-xl font-extrabold text-white mt-0.5">{stats.watchlist}</div>
              </div>
            </div>

            {/* Findings List */}
            {integrityReport && integrityReport.findings.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-zinc-400">
                    Audit Findings ({integrityReport.findings.length})
                  </span>
                  <div className="flex gap-1">
                    {['all', 'error', 'warning', 'info'].map((sev: any) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`text-[10px] px-2 py-0.5 rounded capitalize font-mono ${
                          severityFilter === sev ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredFindings.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs flex items-start gap-2.5">
                      <div className="mt-0.5 flex-none">
                        {f.severity === 'error' ? <AlertOctagon size={14} className="text-red-400" /> :
                         f.severity === 'warning' ? <AlertTriangle size={14} className="text-amber-400" /> :
                         <Info size={14} className="text-sky-400" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200 capitalize">{f.category}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">[{f.code}]</span>
                        </div>
                        <p className="text-zinc-400">{f.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: IMPORT & RECONCILIATION */}
      {activeSection === 'tools' && (
        <div className="space-y-6">
          <ReconciliationPanel onCommitted={loadAll} />
        </div>
      )}

      {/* SECTION 4: DATABASE & BACKUP */}
      {activeSection === 'system' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#121520] border border-zinc-800/80 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                JSON Backup & Restoration
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Export complete canonical collection data or restore from a previous JSON backup
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <span className="text-xs font-bold uppercase font-mono text-zinc-300 block">
                  Export Backup
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Downloads all videos, sessions, performers, tags, and settings as a Schema v2 JSON file.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Download size={14} />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <span className="text-xs font-bold uppercase font-mono text-zinc-300 block">
                  Restore / Import
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload a previously exported backup file to restore or merge records.
                </p>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="text-xs text-zinc-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />

                {validationResult && (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <span className="font-bold text-zinc-200 block">
                        File: {validationResult.stats.videos} videos, {validationResult.stats.sessions} sessions
                      </span>
                      <span className="text-[11px] text-zinc-500 block">
                        Schema Version: {validationResult.schemaVersion}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          importMode === 'merge' ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        Merge
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportMode('replace')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          importMode === 'replace' ? 'bg-red-500 text-white border-red-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        Replace All
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={executeImport}
                      disabled={isImporting}
                      className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      {isImporting ? 'Importing...' : 'Execute Restore'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Developer / Seed Tools */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-zinc-300 uppercase font-mono block">
                  Bootstrap Sample Data
                </span>
                <span className="text-xs text-zinc-500 block">
                  Seeds 30 canonical tags and initial test fixtures if the registry is currently blank.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSeed}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition-colors"
              >
                Seed Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
