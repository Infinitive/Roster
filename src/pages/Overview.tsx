import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Video, Session, WatchlistItem } from '../types';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { FullAnalytics } from '../types/analytics';
import { DiscoveryResult } from '../types/discovery';
import MediaCard from '../components/ui/MediaCard';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { 
  Flame, 
  Sparkles, 
  Film, 
  Plus, 
  Bookmark, 
  ArrowRight, 
  Dices, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  HardDrive,
  Star,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  
  // Dynamic discovery spotlight
  const [spotlight, setSpotlight] = useState<DiscoveryResult | null>(null);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightResults, setSpotlightResults] = useState<DiscoveryResult[]>([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    setLoading(true);
    try {
      const [vids, sess, wl, tags, perfs] = await Promise.all([
        Storage.getVideos(),
        Storage.getSessions(),
        Storage.getWatchlist(),
        Storage.getTags(),
        Storage.getPerformers()
      ]);

      setVideos(vids);
      setSessions(sess);
      setWatchlist(wl);

      const calculated = calculateAnalytics(vids, sess, tags, perfs);
      setAnalytics(calculated);

      // Generate a dynamic "Surprise Me" / "Blind Pull" spotlight if videos exist
      if (vids.length > 0) {
        const disc = generateDiscovery('Surprise Me', calculated);
        setSpotlightResults(disc);
        setSpotlight(disc[0] || null);
      }
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNextSpotlight = () => {
    if (spotlightResults.length === 0) return;
    const nextIdx = (spotlightIndex + 1) % spotlightResults.length;
    setSpotlightIndex(nextIdx);
    setSpotlight(spotlightResults[nextIdx]);
  };

  const handleToggleWatchlist = async (videoId: string) => {
    const existing = watchlist.find(item => item.videoId === videoId);
    if (existing) {
      await Storage.deleteWatchlistItem(existing.id);
      setWatchlist(prev => prev.filter(item => item.id !== existing.id));
    } else {
      const newItem: WatchlistItem = {
        id: `WL-${uuidv4()}`,
        videoId,
        status: 'Queue',
        addedDate: new Date().toISOString(),
        notes: ''
      };
      await Storage.saveWatchlistItem(newItem);
      setWatchlist(prev => [...prev, newItem]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Initializing Command Center...</p>
      </div>
    );
  }

  // Real dataset count
  const realVideos = videos.filter(v => v.datasetType === 'real');
  const researchNeeded = videos.filter(v => v.flags?.includes('research-needed') || v.performerDisplay === 'Unknown');

  // Recently added (top 3)
  const recentlyAdded = [...videos]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3);

  // Top rated / rediscover candidates (personalRating >= 4 or high signal)
  const highRated = videos
    .filter(v => (v.personalRating || 0) >= 4)
    .slice(0, 3);

  // Recent Session
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestSession = sortedSessions[0];
  const latestSessionVideos = latestSession 
    ? latestSession.videoIds.map(id => videos.find(v => v.id === id)).filter(Boolean) as Video[]
    : [];

  // Watchlist Top items
  const queueItems = watchlist
    .map(item => ({ ...item, video: videos.find(v => v.id === item.videoId) }))
    .filter(item => !!item.video)
    .slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Editorial Command Center Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161a28] via-[#111420] to-[#0d0f17] border border-zinc-800/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-950/60 text-amber-300 border border-amber-800/60 font-mono">
                Command Center
              </span>
              {realVideos.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-950/60 text-blue-300 border border-blue-800/60 font-mono">
                  {realVideos.length} Physical Records
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  Seed Library Active
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              T9 Collection Registry
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              Private metadata, behavioral memory, and discovery layer. Physical files remain safe on your T9 drive.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-none">
            <Link
              to="/sessions/new"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-950/40 transition-all active:scale-95"
            >
              <Flame size={15} />
              <span>Log Session</span>
            </Link>

            <Link
              to="/collection"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-200 font-semibold text-xs tracking-wide transition-all"
            >
              <Film size={15} />
              <span>Explore Library</span>
            </Link>
          </div>
        </div>

        {/* Intelligence Summary Row */}
        <div className="mt-6 pt-6 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Total Registry</span>
            <p className="text-xl sm:text-2xl font-bold text-zinc-100">{videos.length}</p>
            <span className="text-[11px] text-zinc-400">
              {analytics?.collection.totalPerformers || 0} performers
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Logged Sessions</span>
            <p className="text-xl sm:text-2xl font-bold text-amber-400">{sessions.length}</p>
            <span className="text-[11px] text-zinc-400">
              {analytics?.activity.recent30DaysSessions || 0} in last 30d
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Collection Use</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">
              {analytics ? `${analytics.activity.collectionUtilization.toFixed(1)}%` : '0%'}
            </p>
            <span className="text-[11px] text-zinc-400">
              {analytics?.activity.uniqueVideosUsed || 0} unique used
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">Metadata Health</span>
            <p className="text-xl sm:text-2xl font-bold text-zinc-200">
              {analytics ? `${(100 - analytics.health.percentageAffected).toFixed(0)}%` : '100%'}
            </p>
            <span className="text-[11px] text-zinc-400">
              {researchNeeded.length > 0 ? `${researchNeeded.length} need research` : 'High confidence'}
            </span>
          </div>
        </div>
      </section>

      {/* Discovery Spotlight: "Worth Exploring" */}
      {spotlight && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold tracking-tight text-zinc-200">Discovery Spotlight</h2>
              <span className="text-[11px] text-zinc-400">· Algorithmic surprise</span>
            </div>
            <button
              type="button"
              onClick={handleNextSpotlight}
              className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/40 hover:bg-indigo-900/40 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Another Pull</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141828] to-[#10131d] border border-indigo-900/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {spotlight.reasonType}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {spotlight.video.folder}
                </span>
                {spotlight.video.personalRating && (
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star size={12} className="fill-amber-400" />
                    {spotlight.video.personalRating}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                <Link to={`/video/${spotlight.videoId}`} className="hover:underline">
                  {spotlight.video.title || spotlight.video.filename}
                </Link>
              </h3>

              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-1">
                {spotlight.video.performerDisplay || 'Unknown Performers'}
              </p>

              <p className="text-xs text-indigo-200/80 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-900/30">
                <strong className="font-semibold text-indigo-200">Why now: </strong>
                {spotlight.reasonText}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-none">
              <button
                type="button"
                onClick={() => handleToggleWatchlist(spotlight.videoId)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  watchlist.some(w => w.videoId === spotlight.videoId)
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                <Bookmark size={14} />
                <span>{watchlist.some(w => w.videoId === spotlight.videoId) ? 'In Queue' : 'Save to Queue'}</span>
              </button>

              <Link
                to={`/sessions/new?videoId=${spotlight.videoId}`}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Flame size={14} />
                <span>Use in Session</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main 2-Column Grid: Left (Media Cards) & Right (Activity / Queue / Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Rediscover & Recently Added */}
        <div className="lg:col-span-2 space-y-8">
          {/* High Rated / Rediscover */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-400 fill-amber-400/20" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-200">High-Signal Content</h2>
              </div>
              <Link to="/collection" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {highRated.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 text-center">
                Rate videos in your collection (★ 4 or 5) to surface proven high-signal performers here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highRated.map(video => (
                  <MediaCard
                    key={video.id}
                    video={video}
                    inWatchlist={watchlist.some(w => w.videoId === video.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recently Added */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-zinc-400" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-200">Recently Added to Registry</h2>
              </div>
              <Link to="/collection" className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                Browse Library <ArrowRight size={12} />
              </Link>
            </div>

            {recentlyAdded.length === 0 ? (
              <EmptyState
                icon={<HardDrive size={24} />}
                title="Your collection registry is empty"
                description="Use Quick Add or load your physical T9 inventory in Settings to register your videos."
                action={
                  <Link
                    to="/quick-add"
                    className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
                  >
                    Quick Add Video
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyAdded.map(video => (
                  <MediaCard
                    key={video.id}
                    video={video}
                    inWatchlist={watchlist.some(w => w.videoId === video.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Recent Activity & Queue */}
        <div className="space-y-8">
          {/* Latest Session Card */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-rose-400" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-200">Latest Session</h2>
              </div>
              <Link to="/sessions" className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                History <ArrowRight size={12} />
              </Link>
            </div>

            {latestSession ? (
              <div className="p-5 rounded-2xl bg-[#12151f] border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    {new Date(latestSession.date).toLocaleDateString(undefined, { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  {latestSession.rating && (
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      ★ {latestSession.rating}
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <p className="text-zinc-200 font-medium">
                    {latestSessionVideos.map(v => v.performerDisplay || v.title).join(', ') || `${latestSession.videoIds.length} video(s)`}
                  </p>
                  <div className="flex gap-2 text-zinc-400 text-[11px] pt-1">
                    {latestSession.duration && <span>{latestSession.duration} mins</span>}
                    {latestSession.orgasmStatus && <span>• {latestSession.orgasmStatus}</span>}
                    {latestSession.vibe && <span>• {latestSession.vibe}</span>}
                  </div>
                </div>

                {latestSession.strongCombination && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/50 inline-block">
                    Strong Combination
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#12151f] border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs text-zinc-400">No sessions recorded yet.</p>
                <Link
                  to="/sessions/new"
                  className="inline-block text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  + Log First Session
                </Link>
              </div>
            )}
          </section>

          {/* Watchlist Queue Preview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark size={18} className="text-amber-400" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-200">Next in Queue</h2>
              </div>
              <Link to="/watchlist" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Full Queue ({watchlist.length}) <ArrowRight size={12} />
              </Link>
            </div>

            {queueItems.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#12151f] border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs text-zinc-400">Queue is currently empty.</p>
                <p className="text-[11px] text-zinc-400">Bookmark videos from the Library to line them up.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {queueItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#12151f] border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/video/${item.videoId}`}
                        className="text-xs font-semibold text-zinc-200 hover:text-white truncate block"
                      >
                        {item.video?.performerDisplay || item.video?.title}
                      </Link>
                      <span className="text-[11px] text-zinc-400 truncate block">
                        {item.video?.title || item.video?.filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-none">
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {item.status}
                      </span>
                      <Link
                        to={`/sessions/new?videoId=${item.videoId}`}
                        title="Start Session"
                        className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 transition-colors"
                      >
                        <Flame size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Physical Folder Distribution */}
          {analytics && analytics.folders.length > 0 && (
            <section className="p-5 rounded-2xl bg-[#12151f] border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <FolderTree size={16} className="text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Collection Layout
                </h3>
              </div>
              <div className="space-y-2">
                {analytics.folders.slice(0, 5).map(f => (
                  <div key={f.folder} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{f.folder}</span>
                      <span className="text-zinc-500 font-mono">{f.count} ({f.collectionPercentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500/80 rounded-full"
                        style={{ width: `${f.collectionPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
