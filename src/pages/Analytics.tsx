import React, { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { calculateAnalytics } from '../engines/analytics';
import { FullAnalytics } from '../types/analytics';
import { Activity, Database, AlertTriangle, Lightbulb, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Analytics() {
  const [data, setData] = useState<FullAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    const videos = await Storage.getVideos();
    const sessions = await Storage.getSessions();
    const result = calculateAnalytics(videos, sessions);
    setData(result);
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-neutral-500">Calculating intelligence...</div>;
  if (!data) return <div className="p-8 text-neutral-500">Failed to calculate analytics.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <PieChart className="text-indigo-400" size={28} />
        <h2 className="text-3xl font-bold">Analytics & Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Database size={16} /> <span className="text-sm font-medium uppercase tracking-wide">Collection</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.collection.totalVideos}</p>
          <p className="text-sm text-neutral-500 mt-1">{data.collection.totalPerformers} Performers · {data.collection.totalTags} Tags</p>
        </div>
        
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Activity size={16} /> <span className="text-sm font-medium uppercase tracking-wide">Sessions</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.activity.totalSessions}</p>
          <p className="text-sm text-neutral-500 mt-1">{data.activity.recent30DaysSessions} in last 30 days</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <Activity size={16} /> <span className="text-sm font-medium uppercase tracking-wide">Utilization</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.activity.collectionUtilization.toFixed(1)}%</p>
          <p className="text-sm text-neutral-500 mt-1">{data.activity.uniqueVideosUsed} unique videos used</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl group relative">
          <div className="flex items-center gap-2 text-neutral-400 mb-2">
            <AlertTriangle size={16} /> <span className="text-sm font-medium uppercase tracking-wide">Health</span>
          </div>
          <p className="text-3xl font-bold text-white">{data.health.percentageAffected.toFixed(1)}%</p>
          <p className="text-sm text-neutral-500 mt-1">Records missing metadata</p>
          
          <div className="absolute top-full left-0 mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-lg p-3 hidden group-hover:block z-10 shadow-xl">
            <h4 className="text-xs font-bold text-neutral-300 uppercase mb-2">Missing Fields</h4>
            <ul className="text-xs text-neutral-400 space-y-1">
              <li className="flex justify-between"><span>Performer:</span> <span>{data.health.missingPerformer}</span></li>
              <li className="flex justify-between"><span>Title:</span> <span>{data.health.missingTitle}</span></li>
              <li className="flex justify-between"><span>Tags:</span> <span>{data.health.missingTags}</span></li>
              <li className="flex justify-between"><span>Resolution:</span> <span>{data.health.unknownResolution}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Database size={20} /> Collection Composition</h3>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wide">By Folder</h4>
              <div className="space-y-2">
                {data.folders.map(f => (
                  <div key={f.folder} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{f.folder}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-neutral-950 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${f.collectionPercentage}%` }}></div>
                      </div>
                      <span className="text-neutral-500 w-12 text-right">{f.collectionPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wide">Top Tags (by representation)</h4>
              <div className="flex flex-wrap gap-2">
                {data.tags.slice(0, 15).map(t => (
                  <span key={t.tag} className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-2 py-1 rounded text-xs flex items-center gap-2">
                    {t.tag} <span className="text-neutral-600">{t.videoCount}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Lightbulb size={20} /> Intelligence & Signals</h3>
          
          <div className="space-y-4">
            {data.opportunities.length > 0 ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5">
                <h4 className="text-sm font-medium text-emerald-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                  Opportunities
                </h4>
                <div className="space-y-3">
                  {data.opportunities.slice(0, 5).map((opp, idx) => (
                    <div key={idx} className="bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-neutral-200 font-medium">{opp.label}</span>
                        <span className="text-[10px] uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">{opp.category}</span>
                      </div>
                      <p className="text-xs text-neutral-400">{opp.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-sm text-neutral-500 text-center">
                Insufficient data to generate opportunities. Log more sessions with ratings.
              </div>
            )}

            {data.combinations.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wide">Recurring Combinations</h4>
                <div className="space-y-3">
                  {data.combinations.slice(0, 5).map((combo, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="text-neutral-300 font-medium mb-1">
                        {combo.videoIds.length} videos combined {combo.occurrences} times
                      </div>
                      {combo.strongOccurrences > 0 && (
                        <span className="text-xs text-indigo-400">{combo.strongOccurrences} strong sessions</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Activity size={20} /> Proven Videos</h3>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {data.videos.filter(v => v.lifecycle === 'Proven' || v.lifecycle === 'Favorite / High Signal').length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">No proven videos yet. Use them more often.</div>
          ) : (
            <div className="divide-y divide-neutral-800/50">
              {data.videos
                .filter(v => v.lifecycle === 'Proven' || v.lifecycle === 'Favorite / High Signal')
                .sort((a, b) => b.timesWatched - a.timesWatched)
                .slice(0, 10)
                .map(v => (
                <div key={v.video.id} className="p-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <Link to={`/video/${v.video.id}`} className="font-medium text-neutral-200 hover:text-white truncate block">
                      {v.video.title || v.video.filename}
                    </Link>
                    <div className="text-xs text-neutral-500 flex gap-3 mt-1">
                      <span className={`${v.lifecycle === 'Favorite / High Signal' ? 'text-yellow-500' : 'text-indigo-400'}`}>
                        {v.lifecycle}
                      </span>
                      <span>Watched {v.timesWatched}x</span>
                      {v.averageSessionRating && <span>Avg ★ {v.averageSessionRating.toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
