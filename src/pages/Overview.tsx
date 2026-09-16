import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Video, Session, WatchlistItem } from '../types';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { FullAnalytics } from '../types/analytics';
import { DiscoveryResult } from '../types/discovery';
import MediaCard from '../components/ui/MediaCard';
import EmptyState from '../components/ui/EmptyState';
import PlayButton from '../components/ui/PlayButton';
import RosterBrand from '../components/ui/RosterBrand';
import { 
  Flame, 
  Sparkles, 
  Film, 
  Plus, 
  Bookmark, 
  ArrowRight, 
  Clock, 
  HardDrive,
  Star, 
  RefreshCw, 
  FolderTree,
  Zap,
  TrendingUp,
  Activity,
  ShieldCheck
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

      // Generate dynamic spotlight pull
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
        <p className="text-xs uppercase tracking-widest font-mono">Opening ROSTER Edition...</p>
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
      {/* Editorial Publication Masthead */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#131622] via-[#0e1018] to-[#090a0f] border border-zinc-800/90 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.2em] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                Active Registry
              </span>
              {realVideos.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.15em] bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                  {realVideos.length} Physical Records
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.15em] bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  Seed Roster
                </span>
              )}
              <span className="text-[10px] font-mono text-zinc-400">
                PWA Local Edition
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-none">
                ROSTER
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed mt-1.5 max-w-xl">
                Private collection registry, rotation log, and discovery intelligence. Media files remain protected on your external storage.
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-none">
            <Link
              to="/sessions/new"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider font-mono shadow-lg shadow-amber-950/40 transition-all active:scale-95"
            >
              <Flame size={15} />
              <span>Log Rotation</span>
            </Link>

            <Link
              to="/collection"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-200 font-bold text-xs uppercase tracking-wider font-mono transition-all"
            >
              <Film size={15} />
              <span>Explore Roster</span>
            </Link>
          </div>
        </div>

        {/* Intelligence Ledger / Key Metrics Strip */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-mono font-semibold">Total Roster</span>
            <p className="text-2xl sm:text-3xl font-black text-white editorial-num">{videos.length}</p>
            <span className="text-[11px] text-zinc-400 font-mono">
              {analytics?.collection.totalPerformers || 0} performers
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-mono font-semibold">Rotation Log</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 editorial-num">{sessions.length}</p>
            <span className="text-[11px] text-zinc-400 font-mono">
              {analytics?.activity.recent30DaysSessions || 0} in last 30d
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-mono font-semibold">Utilization</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 editorial-num">
              {analytics ? `${analytics.activity.collectionUtilization.toFixed(1)}%` : '0%'}
            </p>
            <span className="text-[11px] text-zinc-400 font-mono">
              {analytics?.activity.uniqueVideosUsed || 0} active in play
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-mono font-semibold">Metadata Health</span>
            <p className="text-2xl sm:text-3xl font-black text-zinc-200 editorial-num">
              {analytics ? `${(100 - analytics.health.percentageAffected).toFixed(0)}%` : '100%'}
            </p>
            <span className="text-[11px] text-zinc-400 font-mono">
              {researchNeeded.length > 0 ? `${researchNeeded.length} need review` : 'Verified high'}
            </span>
          </div>
        </div>
      </section>

      {/* Discovery Spotlight: "Scouting Report" */}
      {spotlight && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-amber-400">
                // 01 SCOUTING REPORT
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-400 font-medium">Curated Pick</span>
            </div>
            <button
              type="button"
              onClick={handleNextSpotlight}
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40 transition-colors font-mono"
            >
              <RefreshCw size={12} />
              <span>Next Pick</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-r from-[#121522] to-[#0d0f17] border border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-[0.15em] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {spotlight.reasonType}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {spotlight.video.folder}
                </span>
                {spotlight.video.personalRating && (
                  <span className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                    <Star size={12} className="fill-amber-400" />
                    {spotlight.video.personalRating}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                <Link to={`/video/${spotlight.videoId}`} className="hover:underline hover:text-amber-300 transition-colors">
                  {spotlight.video.title || spotlight.video.filename}
                </Link>
              </h3>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                {spotlight.video.performerDisplay || 'Unknown Performers'}
              </p>

              <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 leading-relaxed">
                <strong className="font-mono text-amber-400 uppercase tracking-wider text-[10px] mr-1.5">Editorial Note:</strong>
                {spotlight.reasonText}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-none font-mono">
              <PlayButton video={spotlight.video} size="sm" variant="primary" />

              <button
                type="button"
                onClick={() => handleToggleWatchlist(spotlight.videoId)}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  watchlist.some(w => w.videoId === spotlight.videoId)
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                <Bookmark size={14} />
                <span>{watchlist.some(w => w.videoId === spotlight.videoId) ? 'In Lineup' : 'Queue'}</span>
              </button>

              <Link
                to={`/sessions/new?videoId=${spotlight.videoId}`}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
              >
                <Flame size={14} className="text-rose-400" />
                <span>Rotate</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): High Signal & Fresh Intake */}
        <div className="lg:col-span-2 space-y-8">
          {/* High Rated / Proven Leaders */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-amber-400">
                  // 02 IN ROTATION
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-400 font-medium">Proven High-Signal Leaders</span>
              </div>
              <Link to="/collection" className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1">
                All Roster <ArrowRight size={12} />
              </Link>
            </div>

            {highRated.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 text-center font-mono">
                Rate items (★ 4 or 5) to surface proven leaders in your active rotation.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {highRated.map((video, idx) => (
                  <MediaCard
                    key={video.id}
                    video={video}
                    rankNumber={idx + 1}
                    inWatchlist={watchlist.some(w => w.videoId === video.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recently Added Intake */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">
                  // 03 FRESH INTAKE
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-400 font-medium">Recent Additions to Registry</span>
              </div>
              <Link to="/collection" className="text-xs text-zinc-400 hover:text-zinc-200 font-mono flex items-center gap-1">
                Full Registry <ArrowRight size={12} />
              </Link>
            </div>

            {recentlyAdded.length === 0 ? (
              <EmptyState
                icon={<HardDrive size={24} />}
                title="Roster is empty"
                description="Use Quick Intake or configure physical storage in Desk to register your media."
                action={
                  <Link
                    to="/quick-add"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs font-mono uppercase"
                  >
                    Intake Video
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyAdded.map((video, idx) => (
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

        {/* Right Column: Activity & Lineup Queue */}
        <div className="space-y-8">
          {/* Latest Session Card */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-rose-400">
                  // LAST ROTATION
                </span>
              </div>
              <Link to="/sessions" className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1">
                Logbook <ArrowRight size={12} />
              </Link>
            </div>

            {latestSession ? (
              <div className="p-4 sm:p-5 rounded-xl bg-[#10121a] border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 font-mono">
                    {new Date(latestSession.date).toLocaleDateString(undefined, { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  {latestSession.rating && (
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-mono">
                      ★ {latestSession.rating}
                    </span>
                  )}
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <p className="text-zinc-100 font-bold text-sm leading-snug">
                    {latestSessionVideos.map(v => v.performerDisplay || v.title).join(', ') || `${latestSession.videoIds.length} item(s)`}
                  </p>
                  <div className="flex gap-2 text-zinc-400 text-[11px] pt-1 font-mono">
                    {latestSession.duration && <span>{latestSession.duration}m</span>}
                    {latestSession.orgasmStatus && <span>• {latestSession.orgasmStatus}</span>}
                    {latestSession.vibe && <span>• {latestSession.vibe}</span>}
                  </div>
                </div>

                {latestSession.strongCombination && (
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50 inline-block">
                    Strong Combination
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-[#10121a] border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs text-zinc-400 font-mono">No rotations logged yet.</p>
                <Link
                  to="/sessions/new"
                  className="inline-block text-xs font-bold font-mono text-amber-400 hover:text-amber-300"
                >
                  + Log First Rotation
                </Link>
              </div>
            )}
          </section>

          {/* Watchlist / Lineup Preview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-amber-400">
                  // THE LINEUP
                </span>
              </div>
              <Link to="/watchlist" className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1">
                Queue ({watchlist.length}) <ArrowRight size={12} />
              </Link>
            </div>

            {queueItems.length === 0 ? (
              <div className="p-5 rounded-xl bg-[#10121a] border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs text-zinc-400 font-mono">Lineup is empty.</p>
                <p className="text-[11px] text-zinc-500">Add performers or items from the Roster to queue them.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queueItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-[#10121a] border border-zinc-800/90 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/video/${item.videoId}`}
                        className="text-xs font-bold text-zinc-200 hover:text-amber-300 truncate block"
                      >
                        {item.video?.performerDisplay || item.video?.title}
                      </Link>
                      <span className="text-[11px] text-zinc-400 truncate block font-mono">
                        {item.video?.title || item.video?.filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-none font-mono">
                      {item.video && (
                        <PlayButton video={item.video} size="xs" variant="primary" />
                      )}
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Roster Structure / Folders */}
          {analytics && analytics.folders.length > 0 && (
            <section className="p-4 sm:p-5 rounded-xl bg-[#10121a] border border-zinc-800/90 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-zinc-800/80">
                <FolderTree size={14} className="text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                  Roster Structure
                </h3>
              </div>
              <div className="space-y-2">
                {analytics.folders.slice(0, 5).map(f => (
                  <div key={f.folder} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">{f.folder}</span>
                      <span className="text-zinc-500">{f.count} ({f.collectionPercentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
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
