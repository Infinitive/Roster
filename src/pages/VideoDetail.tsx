import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Video, Session, WatchlistItem } from '../types';
import { calculateVideoHistory, WatchHistory } from '../engines/history';
import TagChip from '../components/ui/TagChip';
import Badge from '../components/ui/Badge';
import { 
  Bookmark, 
  BookmarkCheck, 
  Flame, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle,
  CheckCircle2,
  Star,
  Clock,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Folder,
  Sliders,
  FileCode
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [history, setHistory] = useState<WatchHistory | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  async function loadData(videoId: string) {
    setLoading(true);
    try {
      const v = await Storage.getVideo(videoId);
      if (!v) {
        setLoading(false);
        return;
      }
      setVideo(v);
      
      const sessions = await Storage.getSessions();
      setHistory(calculateVideoHistory(videoId, sessions));

      const watchlist = await Storage.getWatchlist();
      const wlItem = watchlist.find(item => item.videoId === videoId);
      if (wlItem) {
        setWatchlistStatus(wlItem.status);
        setWatchlistItemId(wlItem.id);
      } else {
        setWatchlistStatus(null);
        setWatchlistItemId(null);
      }
    } catch (err) {
      console.error('Failed to load video details:', err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleWatchlist() {
    if (!video) return;
    if (watchlistStatus && watchlistItemId) {
      await Storage.deleteWatchlistItem(watchlistItemId);
      setWatchlistStatus(null);
      setWatchlistItemId(null);
    } else {
      const newItem: WatchlistItem = {
        id: `WL-${uuidv4()}`,
        videoId: video.id,
        status: 'Queue',
        addedDate: new Date().toISOString(),
        notes: ''
      };
      await Storage.saveWatchlistItem(newItem);
      setWatchlistStatus(newItem.status);
      setWatchlistItemId(newItem.id);
    }
  }

  async function updateRating(rating: number | undefined) {
    if (!video) return;
    const updated: Video = {
      ...video,
      personalRating: rating,
      updatedAt: Date.now()
    };
    await Storage.saveVideo(updated);
    setVideo(updated);
  }

  async function markAsUserConfirmed() {
    if (!video) return;
    const now = Date.now();
    const updated: Video = {
      ...video,
      flags: (video.flags || []).filter(f => f !== 'research-needed'),
      provenance: {
        ...video.provenance,
        performers: { level: 'user-confirmed', source: 'user', confirmedAt: now },
        title: { level: 'user-confirmed', source: 'user', confirmedAt: now },
        tags: { level: 'user-confirmed', source: 'user', confirmedAt: now },
        resolution: { level: 'user-confirmed', source: 'user', confirmedAt: now }
      },
      updatedAt: now
    };
    await Storage.saveVideo(updated);
    setVideo(updated);
    setConfirmStatus('Metadata marked as User Confirmed.');
    setTimeout(() => setConfirmStatus(null), 3500);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Loading Media Record...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-zinc-400">Media record not found.</p>
        <Link to="/collection" className="text-xs font-semibold text-amber-400 hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  const initials = (video.performerDisplay || video.title || 'T9')
    .split(/[\s&,/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'T9';

  const tagList = video.originalTags
    ? video.originalTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const perfProv = video.provenance?.performers?.level || 'parsed';
  const titleProv = video.provenance?.title?.level || 'parsed';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Navigation & Action Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={toggleWatchlist}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              watchlistStatus 
                ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
          >
            {watchlistStatus ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            <span>{watchlistStatus ? `In Queue (${watchlistStatus})` : 'Add to Queue'}</span>
          </button>

          <Link
            to={`/sessions/new?videoId=${video.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-950/30 transition-all active:scale-95"
          >
            <Flame size={15} />
            <span>Log Session</span>
          </Link>
        </div>
      </div>

      {confirmStatus && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 size={16} />
          <span>{confirmStatus}</span>
        </div>
      )}

      {/* Main Media Showcase Card */}
      <div className="rounded-3xl bg-[#121520] border border-zinc-800/80 overflow-hidden shadow-xl">
        {/* Banner Section with Avatar Monogram */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-[#181d2e] via-[#141724] to-[#121520] border-b border-zinc-800/60">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Architectural Monogram Box */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-lg sm:text-2xl font-black text-zinc-200 tracking-wider shadow-inner flex-none">
              {initials}
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              {/* Badges / Classification */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {video.folder}
                </span>

                {video.resolution && video.resolution !== 'Unknown' && (
                  <Badge variant="resolution" size="sm">
                    {video.resolution}
                  </Badge>
                )}

                {video.datasetType === 'real' ? (
                  <Badge variant="real" size="sm">
                    Real Physical
                  </Badge>
                ) : (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    Seed Dataset
                  </span>
                )}

                {video.flags?.includes('research-needed') && (
                  <Badge variant="research" size="sm" icon={<HelpCircle size={12} />}>
                    Research Needed
                  </Badge>
                )}

                {video.flags?.includes('participant-folder-mismatch') && (
                  <Badge variant="mismatch" size="sm" icon={<AlertTriangle size={12} />}>
                    Participant Mismatch
                  </Badge>
                )}
              </div>

              {/* Performers Headline */}
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {video.performerDisplay || 'Unknown Performers'}
              </h1>

              {/* Title / Description */}
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                {video.title || video.filename}
              </p>

              {/* Interactive Personal Rating */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Personal Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => {
                    const active = (video.personalRating || 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateRating(video.personalRating === star ? undefined : star)}
                        title={`Rate ${star} Stars`}
                        className={`p-1 rounded hover:scale-110 transition-transform ${
                          active ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        <Star size={18} className={active ? 'fill-amber-400' : ''} />
                      </button>
                    );
                  })}
                  {video.personalRating && (
                    <button
                      type="button"
                      onClick={() => updateRating(undefined)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags and Semantic Attributes */}
        <div className="p-6 sm:p-8 space-y-6">
          {tagList.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                Canonical Tags ({tagList.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {tagList.map((tag, idx) => (
                  <TagChip key={idx} tag={tag} size="sm" />
                ))}
              </div>
            </div>
          )}

          {/* Quick specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
            <div>
              <span className="text-zinc-500 font-mono uppercase block text-[10px]">Participants</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{video.participantCount}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-mono uppercase block text-[10px]">Vibe / Energy</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{video.vibe || 'Unspecified'}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-mono uppercase block text-[10px]">Source</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{video.source || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-zinc-500 font-mono uppercase block text-[10px]">Date Added</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{video.dateAdded || 'N/A'}</p>
            </div>
          </div>

          {video.notes && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                Personal Notes
              </span>
              <p className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-zinc-300 leading-relaxed">
                {video.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column: Behavioral Memory & Related Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Summary & Related Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                <h2 className="text-base font-bold text-zinc-100">Behavioral History</h2>
              </div>
              <span className="text-xs text-zinc-400">
                {history?.timesWatched || 0} Total Watches
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Times Watched</span>
                <p className="text-xl font-bold text-white mt-1">{history?.timesWatched || 0}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Last Watched</span>
                <p className="text-xs font-semibold text-zinc-200 mt-1">
                  {history?.lastWatched ? new Date(history.lastWatched).toLocaleDateString() : 'Never'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Days Elapsed</span>
                <p className="text-xl font-bold text-zinc-200 mt-1">
                  {history?.daysSinceLastWatched !== null ? `${history?.daysSinceLastWatched}d` : '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Avg Session ★</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {history?.averageSessionRating || '—'}
                </p>
              </div>
            </div>

            {/* Related Sessions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                Session Timeline ({history?.sessionsInvolved.length || 0})
              </span>

              {history?.sessionsInvolved && history.sessionsInvolved.length > 0 ? (
                <div className="space-y-2">
                  {history.sessionsInvolved.map(session => (
                    <Link
                      key={session.id}
                      to={`/sessions/${session.id}`}
                      className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {session.rating && (
                            <span className="text-[11px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.2 rounded">
                              ★ {session.rating}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex gap-2">
                          {session.duration && <span>{session.duration} mins</span>}
                          {session.orgasmStatus && <span>• {session.orgasmStatus}</span>}
                          {session.vibe && <span>• {session.vibe}</span>}
                        </div>
                      </div>

                      {session.strongCombination && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950/70 text-indigo-300 border border-indigo-900/60 px-2 py-0.5 rounded-md">
                          Combo
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                  No sessions recorded featuring this video yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Provenance, Verification & Progressive Disclosure */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Provenance & Trust
                </h3>
              </div>
              <button
                type="button"
                onClick={markAsUserConfirmed}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium transition-colors"
              >
                Confirm All
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">Performers</span>
                <span className="font-semibold text-zinc-200 capitalize font-mono">{perfProv}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">Title</span>
                <span className="font-semibold text-zinc-200 capitalize font-mono">{titleProv}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">Tags Resolution</span>
                <span className="font-semibold text-zinc-200 capitalize font-mono">
                  {video.provenance?.tags?.level || 'parsed'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
                <span className="text-zinc-500">Physical Resolution</span>
                <span className="font-semibold text-zinc-200 capitalize font-mono">
                  {video.provenance?.resolution?.level || 'parsed'}
                </span>
              </div>
            </div>

            {/* Collapsible Technical Inspection Details */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setShowTechnical(!showTechnical)}
                className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 py-1"
              >
                <span className="font-mono">Physical File Path & Metadata</span>
                {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showTechnical && (
                <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-[11px] font-mono text-zinc-400 break-all">
                  <div>
                    <span className="text-zinc-600 block">Relative Path:</span>
                    <span className="text-zinc-300">{video.relativePath}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">Physical Filename:</span>
                    <span className="text-zinc-300">{video.filename}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">Internal ID:</span>
                    <span className="text-zinc-500">{video.id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
