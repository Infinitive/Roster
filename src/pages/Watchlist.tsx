import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { WatchlistItem, Video } from '../types';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import PlayButton from '../components/ui/PlayButton';
import { 
  Bookmark, 
  Flame, 
  Trash2, 
  Star
} from 'lucide-react';

interface PopulatedWatchlistItem extends WatchlistItem {
  video?: Video;
}

const WATCHLIST_STATUSES = ['Next', 'Queue', 'Rediscover', 'Research', 'Maybe'] as const;

export default function Watchlist() {
  const [items, setItems] = useState<PopulatedWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    try {
      const [dbItems, videos] = await Promise.all([
        Storage.getWatchlist(),
        Storage.getVideos()
      ]);
      
      const populated = dbItems.map(item => {
        const video = videos.find(v => v.id === item.videoId);
        return { ...item, video };
      });
      
      setItems(populated);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: any) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, status };
    delete updated.video;
    await Storage.saveWatchlistItem(updated);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  }

  async function removeItem(id: string) {
    await Storage.deleteWatchlistItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Loading Lineup Queue...</p>
      </div>
    );
  }

  const filteredItems = activeTab === 'All' 
    ? items 
    : items.filter(i => i.status === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        sectionNumber="LINEUP QUEUE"
        title="The Lineup"
        icon={<Bookmark size={24} className="text-amber-400" />}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
            {items.length} In Lineup
          </span>
        }
        subtitle="Active media queue: Next in rotation, Research targets, and Rediscovery candidates."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 font-mono">
        {['All', ...WATCHLIST_STATUSES].map(status => {
          const count = status === 'All' ? items.length : items.filter(i => i.status === status).length;
          const active = activeTab === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveTab(status)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                active
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>{status}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                active ? 'bg-amber-900/60 text-amber-200' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={28} className="text-amber-400" />}
          title={activeTab === 'All' ? 'Your Lineup is empty' : `No items in "${activeTab}" status`}
          description="Bookmark videos from the Roster or Scouting suggestions to queue them up here."
          action={
            <Link
              to="/collection"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono uppercase"
            >
              Explore Roster
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                    {item.video?.folder || 'Folder'}
                  </span>
                  {item.video?.personalRating && (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1 font-mono">
                      <Star size={11} className="fill-amber-400" />
                      {item.video.personalRating}
                    </span>
                  )}
                </div>

                <Link
                  to={`/video/${item.videoId}`}
                  className="text-sm font-bold text-zinc-100 hover:text-amber-300 line-clamp-2 leading-snug transition-colors"
                >
                  {item.video?.title || item.video?.filename || 'Unknown Video'}
                </Link>

                {item.video?.performerDisplay && (
                  <p className="text-xs text-zinc-400 line-clamp-1 font-medium font-mono">
                    {item.video.performerDisplay}
                  </p>
                )}
              </div>

              {/* Status Switcher & Bottom Actions */}
              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs font-mono">
                <select
                  value={item.status}
                  onChange={e => updateStatus(item.id, e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded px-2 py-1 outline-none font-mono"
                >
                  {WATCHLIST_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5">
                  {item.video && (
                    <PlayButton video={item.video} size="xs" variant="primary" />
                  )}

                  <Link
                    to={`/sessions/new?videoId=${item.videoId}`}
                    title="Log Rotation"
                    className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Flame size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove from lineup"
                    className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
