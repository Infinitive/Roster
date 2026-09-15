import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { calculateAnalytics } from '../engines/analytics';
import { FullAnalytics } from '../types/analytics';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import TagChip from '../components/ui/TagChip';
import { 
  BarChart3, 
  Activity, 
  Database, 
  AlertTriangle, 
  Lightbulb, 
  Star, 
  Flame, 
  FolderTree, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [videos, sessions, tags, performers] = await Promise.all([
        Storage.getVideos(),
        Storage.getSessions(),
        Storage.getTags(),
        Storage.getPerformers(),
      ]);
      const result = calculateAnalytics(videos, sessions, tags, performers);
      setData(result);
    } catch (err) {
      console.error('Failed to calculate analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Computing Collection Intelligence...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Unable to calculate intelligence metrics. Ensure videos exist in database.
      </div>
    );
  }

  const provenVideos = data.videos.filter(
    v => v.lifecycle === 'Proven' || v.lifecycle === 'Favorite / High Signal'
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <PageHeader
        title="Collection Intelligence"
        icon={<BarChart3 size={24} className="text-emerald-400" />}
        subtitle="Behavioral reality, proven strengths, combination dynamics, and metadata hygiene."
      />

      {/* Primary KPI Intelligence Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Collection Size */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Archive Volume</span>
            <Database size={15} className="text-zinc-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{data.collection.totalVideos}</p>
          <p className="text-xs text-zinc-400">
            {data.collection.totalPerformers} Performers · {data.collection.totalTags} Tags
          </p>
        </div>

        {/* Behavioral Activity */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Activity Sessions</span>
            <Flame size={15} className="text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{data.activity.totalSessions}</p>
          <p className="text-xs text-zinc-400">
            {data.activity.recent30DaysSessions} in last 30 days
          </p>
        </div>

        {/* Collection Utilization */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Utilization Rate</span>
            <Activity size={15} className="text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {data.activity.collectionUtilization.toFixed(1)}%
          </p>
          <p className="text-xs text-zinc-400">
            {data.activity.uniqueVideosUsed} unique videos used
          </p>
        </div>

        {/* Metadata Health */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono">Confidence Level</span>
            <ShieldAlert size={15} className="text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
            {(100 - data.health.percentageAffected).toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-400">
            {data.health.cleanCount} fully resolved clean records
          </p>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Physical Composition & Tag Signals */}
        <div className="space-y-6">
          {/* Folder Breakdown */}
          <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderTree size={17} className="text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Physical Folder Hierarchy
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Distribution</span>
            </div>

            <div className="space-y-3">
              {data.folders.map(f => (
                <div key={f.folder} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">{f.folder}</span>
                    <span className="font-mono text-zinc-500">
                      {f.count} videos ({f.collectionPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full"
                      style={{ width: `${f.collectionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Canonical Tags */}
          <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles size={17} className="text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Tag Representation
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Top Signals</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.tags.slice(0, 24).map(t => (
                <div
                  key={t.tag}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs"
                >
                  <TagChip tag={t.tag} size="xs" />
                  <span className="text-zinc-500 font-mono text-[11px]">{t.videoCount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Opportunities & Strong Combinations */}
        <div className="space-y-6">
          {/* Opportunities & Gaps */}
          <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Lightbulb size={17} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Emerging Opportunities & Gaps
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">{data.opportunities.length} Signals</span>
            </div>

            {data.opportunities.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                Insufficient rating and session history to detect opportunities. Log sessions with ratings (★ 1-5) to unlock intelligence.
              </div>
            ) : (
              <div className="space-y-3">
                {data.opportunities.slice(0, 5).map((opp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200">{opp.label}</span>
                      <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                        {opp.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{opp.evidence}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recurring Combinations */}
          <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Zap size={17} className="text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Recurring Video Combinations
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Multi-Video Synergy</span>
            </div>

            {data.combinations.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                No recurring multi-video combinations detected yet. Add multiple videos to sessions to track synergies.
              </div>
            ) : (
              <div className="space-y-3">
                {data.combinations.slice(0, 5).map((combo, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">
                        {combo.videoIds.length} videos combined {combo.occurrences} times
                      </span>
                      {combo.strongOccurrences > 0 && (
                        <span className="text-[11px] text-indigo-400 font-mono">
                          ★ {combo.strongOccurrences} strong sessions
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-900/60 font-mono">
                      Synergy
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Proven High Signal Media */}
      <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Star size={17} className="text-amber-400 fill-amber-400/30" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Proven High-Signal Videos ({provenVideos.length})
            </h3>
          </div>
          <Link to="/collection" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
            Browse full library <ArrowRight size={13} />
          </Link>
        </div>

        {provenVideos.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
            No proven videos yet. As you repeat and rate videos across sessions, they will graduate to Proven status here.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 rounded-xl overflow-hidden border border-zinc-800">
            {provenVideos.slice(0, 8).map(v => (
              <div
                key={v.video.id}
                className="p-3.5 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/video/${v.video.id}`}
                    className="text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white truncate block"
                  >
                    {v.video.performerDisplay ? `${v.video.performerDisplay} — ` : ''}
                    {v.video.title || v.video.filename}
                  </Link>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5 font-mono">
                    <span className="text-amber-400 font-semibold">{v.lifecycle}</span>
                    <span>Watched {v.timesWatched}x</span>
                    {v.averageSessionRating && <span>Avg ★ {v.averageSessionRating.toFixed(1)}</span>}
                  </div>
                </div>

                <Link
                  to={`/video/${v.video.id}`}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Metadata Hygiene & Quality Health */}
      <section className="p-6 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldAlert size={17} className="text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 font-mono">
              Metadata Hygiene & Incompleteness
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {data.health.recordsWithIssues} Records Flagged
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[11px]">Missing Performer</span>
            <p className="text-lg font-bold text-zinc-200 mt-1">{data.health.missingPerformer}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[11px]">Missing Title</span>
            <p className="text-lg font-bold text-zinc-200 mt-1">{data.health.missingTitle}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[11px]">Missing Tags</span>
            <p className="text-lg font-bold text-zinc-200 mt-1">{data.health.missingTags}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[11px]">Unknown Resolution</span>
            <p className="text-lg font-bold text-zinc-200 mt-1">{data.health.unknownResolution}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
