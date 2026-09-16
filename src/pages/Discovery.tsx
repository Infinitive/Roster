import React, { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { DiscoveryMode, DiscoveryResult } from '../types/discovery';
import { FullAnalytics } from '../types/analytics';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import TagChip from '../components/ui/TagChip';
import Badge from '../components/ui/Badge';
import PlayButton from '../components/ui/PlayButton';
import { 
  Sparkles, 
  Dices, 
  RotateCcw, 
  Star, 
  Layers, 
  Search, 
  Zap, 
  Flame, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  Info, 
  RefreshCw,
  EyeOff,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WatchlistItem } from '../types';

interface ModeConfig {
  id: DiscoveryMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const MODES: ModeConfig[] = [
  { id: 'Surprise Me', label: 'Surprise Me', desc: 'Balanced pull between proven favorites and novelty', icon: <Sparkles size={15} /> },
  { id: 'Blind Pull', label: 'Blind Pull', desc: 'Unbiased direct pull with zero assumptions', icon: <EyeOff size={15} /> },
  { id: 'High Signal', label: 'High Signal', desc: 'Proven ★4-5 stars and highest-rated performers', icon: <Star size={15} /> },
  { id: 'Unwatched', label: 'Unwatched', desc: 'Never-before-used videos in your registry', icon: <Layers size={15} /> },
  { id: 'Rediscover', label: 'Rediscover', desc: 'Rated videos you haven’t visited in 30+ days', icon: <RotateCcw size={15} /> },
  { id: 'Deep Cut', label: 'Deep Cut', desc: 'Hidden gems buried deep in larger group folders', icon: <Search size={15} /> },
  { id: 'Old Favorite', label: 'Old Favorite', desc: 'Videos with strong historical performance', icon: <Flame size={15} /> },
  { id: 'Gap Explorer', label: 'Gap Explorer', desc: 'Fills underrepresented combinations or themes', icon: <Zap size={15} /> },
  { id: 'Category Explorer', label: 'Category Explorer', desc: 'Focused pull based on specific folder or tag', icon: <Compass size={15} /> },
  { id: 'Random', label: 'True Random', desc: 'Completely unweighted shuffle across all records', icon: <Dices size={15} /> },
];

export default function Discovery() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<DiscoveryMode>('Surprise Me');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Category explorer inputs
  const [catType, setCatType] = useState<'folder' | 'tag' | 'vibe'>('folder');
  const [catValue, setCatValue] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [videos, sessions, tags, performers, wl] = await Promise.all([
        Storage.getVideos(),
        Storage.getSessions(),
        Storage.getTags(),
        Storage.getPerformers(),
        Storage.getWatchlist(),
      ]);
      const data = calculateAnalytics(videos, sessions, tags, performers);
      setAnalytics(data);
      setWatchlist(wl);

      // Initial run
      const res = generateDiscovery('Surprise Me', data);
      setResults(res);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load discovery:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRunDiscovery = (selectedMode = mode) => {
    if (!analytics) return;
    const opts = {
      categoryType: catType,
      categoryValue: catValue
    };
    const res = generateDiscovery(selectedMode, analytics, opts);
    setResults(res);
    setCurrentIndex(0);
  };

  const handleModeChange = (newMode: DiscoveryMode) => {
    setMode(newMode);
    handleRunDiscovery(newMode);
  };

  const handleAddToWatchlist = async (videoId: string) => {
    const existing = watchlist.find(w => w.videoId === videoId);
    if (existing) {
      await Storage.deleteWatchlistItem(existing.id);
      setWatchlist(prev => prev.filter(w => w.id !== existing.id));
      showFeedback('Removed from Lineup');
    } else {
      const newItem: WatchlistItem = {
        id: `WL-${uuidv4()}`,
        videoId,
        status: 'Queue',
        addedDate: new Date().toISOString(),
        notes: `Added via ${mode} scout`
      };
      await Storage.saveWatchlistItem(newItem);
      setWatchlist(prev => [...prev, newItem]);
      showFeedback('Added to Lineup Queue');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Running Scouting Intelligence...</p>
      </div>
    );
  }

  const currentResult = results[currentIndex];
  const tagList = currentResult?.video.originalTags
    ? currentResult.video.originalTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const inWatchlist = currentResult ? watchlist.some(w => w.videoId === currentResult.videoId) : false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        sectionNumber="SCOUTING REPORT"
        title="Discovery &amp; Rotation"
        icon={<Sparkles size={24} className="text-amber-400" />}
        subtitle="Algorithmic curation balancing proven performers, novel intake, and unrated cuts."
      />

      {feedbackMsg && (
        <div className="p-3 bg-amber-950/70 border border-amber-800 text-amber-300 text-xs rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 size={14} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Mode Selector Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-mono block">
          Select Scouting Strategy
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MODES.map(m => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[72px] font-mono ${
                  active
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40 font-bold'
                    : 'bg-[#10121a] border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={active ? 'text-amber-400' : 'text-zinc-500'}>
                    {m.icon}
                  </span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </div>
                <div className="mt-2">
                  <span className="text-xs block leading-tight truncate">
                    {m.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Explorer Controls if active */}
      {mode === 'Category Explorer' && analytics && (
        <div className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 space-y-3 font-mono">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Category Scouting Filters
          </span>
          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <select
              value={catType}
              onChange={e => {
                setCatType(e.target.value as any);
                setCatValue('');
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200"
            >
              <option value="folder">By Folder</option>
              <option value="tag">By Canonical Tag</option>
              <option value="vibe">By Energy / Vibe</option>
            </select>

            <select
              value={catValue}
              onChange={e => setCatValue(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200"
            >
              <option value="">Choose a target {catType}...</option>
              {catType === 'folder' &&
                analytics.folders.map(f => (
                  <option key={f.folder} value={f.folder}>
                    {f.folder} ({f.count})
                  </option>
                ))}
              {catType === 'tag' &&
                analytics.tags.slice(0, 35).map(t => (
                  <option key={t.tag} value={t.tag}>
                    {t.tag} ({t.videoCount})
                  </option>
                ))}
              {catType === 'vibe' &&
                ['Aggressive', 'Worship', 'Filthy', 'Degrading', 'Tender', 'Chaotic', 'Power', 'Size-focused'].map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={() => handleRunDiscovery()}
              disabled={!catValue}
              className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold uppercase tracking-wider transition-colors"
            >
              Scout
            </button>
          </div>
        </div>
      )}

      {/* Discovery Showcase Card */}
      {!currentResult ? (
        <div className="p-12 text-center rounded-xl bg-[#10121a] border border-zinc-800 text-zinc-400 space-y-3 font-mono">
          <p className="text-sm font-bold">No results found for {mode}.</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {mode === 'Gap Explorer' && 'Requires identifiable opportunities or rated session patterns.'}
            {mode === 'Rediscover' && 'Requires videos with rated session history older than 30 days.'}
            {mode === 'Category Explorer' && 'Select a category and value above to begin.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#10121a] border border-zinc-800 shadow-2xl overflow-hidden">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#151824] via-[#10121a] to-[#10121a] border-b border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    {currentResult.reasonType}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {currentResult.video.folder}
                  </span>
                  {currentResult.video.resolution && (
                    <Badge variant="resolution" size="xs">
                      {currentResult.video.resolution}
                    </Badge>
                  )}
                </div>

                <span className="text-xs font-mono text-zinc-500">
                  Pick {currentIndex + 1} of {results.length}
                </span>
              </div>

              {/* Title & Performer */}
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                <Link to={`/video/${currentResult.videoId}`} className="hover:underline hover:text-amber-300 transition-colors">
                  {currentResult.video.title || currentResult.video.filename}
                </Link>
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 font-bold">
                {currentResult.video.performerDisplay || 'Unknown Performers'}
              </p>

              {/* Tags */}
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tagList.map((tag, idx) => (
                    <TagChip key={idx} tag={tag} size="xs" />
                  ))}
                </div>
              )}
            </div>

            {/* Rationale & Supporting Signals */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Info size={15} />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    Scout Rationale
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {currentResult.reasonText}
                </p>

                {currentResult.supportingSignals.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                      Signals:
                    </span>
                    <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside font-mono">
                      {currentResult.supportingSignals.map((sig, i) => (
                        <li key={i}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 font-mono">
                <PlayButton video={currentResult.video} size="sm" variant="primary" label="Play Media" />

                <button
                  type="button"
                  onClick={() => handleAddToWatchlist(currentResult.videoId)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                    inWatchlist
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                  }`}
                >
                  {inWatchlist ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                  <span>{inWatchlist ? 'In Lineup' : 'Queue'}</span>
                </button>

                <Link
                  to={`/sessions/new?videoId=${currentResult.videoId}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs transition-colors border border-zinc-700 uppercase tracking-wider"
                >
                  <Flame size={15} className="text-rose-400" />
                  <span>Rotate</span>
                </Link>

                <Link
                  to={`/video/${currentResult.videoId}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs transition-colors uppercase tracking-wider"
                >
                  <span>Profile</span>
                  <ArrowRight size={14} />
                </Link>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex < results.length - 1) {
                      setCurrentIndex(currentIndex + 1);
                    } else {
                      handleRunDiscovery();
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition-colors"
                >
                  <span>Next Pick</span>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
