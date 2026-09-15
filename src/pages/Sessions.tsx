import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { Session, Video } from '../types';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { 
  Flame, 
  Plus, 
  Clock, 
  Star, 
  Sparkles, 
  Calendar, 
  Film,
  Zap
} from 'lucide-react';

interface PopulatedSession extends Session {
  videoDetails: Video[];
}

export default function Sessions() {
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const [dbSessions, dbVideos] = await Promise.all([
        Storage.getSessions(),
        Storage.getVideos()
      ]);
      
      // Sort by date desc
      dbSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const populated = dbSessions.map(s => ({
        ...s,
        videoDetails: s.videoIds.map(vid => dbVideos.find(v => v.id === vid)).filter(Boolean) as Video[]
      }));
      
      setSessions(populated);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate summary metrics
  const strongCombos = sessions.filter(s => s.strongCombination).length;
  const ratedSessions = sessions.filter(s => s.rating);
  const avgRating = ratedSessions.length > 0
    ? (ratedSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / ratedSessions.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Sessions"
        icon={<Flame size={24} className="text-amber-500" />}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            {sessions.length} Recorded
          </span>
        }
        subtitle="Tactile behavioral memory, video pairings, and encounter logs."
        actions={
          <Link 
            to="/sessions/new" 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-950/30 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Log Session</span>
          </Link>
        }
      />

      {/* Activity Summary Bar */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#121520] border border-zinc-800/80 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Total Logged</span>
            <p className="text-xl font-bold text-white">{sessions.length}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Average Rating</span>
            <p className="text-xl font-bold text-amber-400">
              {avgRating ? `★ ${avgRating}` : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Strong Combos</span>
            <p className="text-xl font-bold text-indigo-400">{strongCombos}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-zinc-500">Total Duration</span>
            <p className="text-xl font-bold text-zinc-300">
              {sessions.reduce((acc, s) => acc + (s.duration || 0), 0)} min
            </p>
          </div>
        </div>
      )}

      {/* Sessions Timeline List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs uppercase tracking-widest font-mono">Loading Sessions History...</p>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Flame size={28} className="text-rose-400" />}
          title="No sessions logged yet"
          description="Capture your sessions to build true behavioral memory. Record ratings, video combinations, vibes, and outcome statuses."
          action={
            <Link
              to="/sessions/new"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
            >
              Log Your First Session
            </Link>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {sessions.map(session => (
            <div
              key={session.id}
              className="group p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Session Header Badges */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-zinc-100 font-mono">
                    {new Date(session.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>

                  {session.rating && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/50">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {session.rating}
                    </span>
                  )}

                  {session.duration && (
                    <span className="flex items-center gap-1 text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      <Clock size={11} />
                      {session.duration}m
                    </span>
                  )}

                  {session.strongCombination && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-900/60 flex items-center gap-1">
                      <Zap size={10} />
                      Strong Combo
                    </span>
                  )}

                  {session.vibe && (
                    <span className="text-[11px] font-medium text-zinc-300 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {session.vibe}
                    </span>
                  )}

                  {session.orgasmStatus && (
                    <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800/60">
                      {session.orgasmStatus}
                    </span>
                  )}
                </div>

                {/* Videos Involved in Session */}
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {session.videoIds.length} video(s) featured:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {session.videoDetails.length > 0 ? (
                      session.videoDetails.map(vid => (
                        <Link
                          key={vid.id}
                          to={`/video/${vid.id}`}
                          className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors flex items-center gap-1.5"
                        >
                          <Film size={12} className="text-zinc-500" />
                          <span className="font-semibold text-zinc-200">
                            {vid.performerDisplay || 'Unknown'}:
                          </span>
                          <span className="truncate max-w-xs text-zinc-400">
                            {vid.title || vid.filename}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">Unlinked or legacy IDs</span>
                    )}
                  </div>
                </div>

                {session.notes && (
                  <p className="text-xs text-zinc-400 italic pt-1 border-t border-zinc-800/60">
                    "{session.notes}"
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 flex-none pt-2 md:pt-0">
                <Link
                  to={`/sessions/${session.id}`}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                >
                  Edit Log
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
