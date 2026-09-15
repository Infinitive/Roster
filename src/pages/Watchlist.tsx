import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { WatchlistItem, Video } from '../types';
import { Link } from 'react-router-dom';
import { calculateVideoHistory } from '../engines/history';

interface PopulatedWatchlistItem extends WatchlistItem {
  video?: Video;
}

const WATCHLIST_STATUSES = ['Next', 'Queue', 'Rediscover', 'Research', 'Maybe'];

export default function Watchlist() {
  const [items, setItems] = useState<PopulatedWatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    const dbItems = await Storage.getWatchlist();
    const videos = await Storage.getVideos();
    const sessions = await Storage.getSessions();
    
    const populated = dbItems.map(item => {
      const video = videos.find(v => v.id === item.videoId);
      return { ...item, video };
    });
    
    setItems(populated);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
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
    return <div className="p-8 text-neutral-500">Loading Watchlist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Watchlist</h2>
      </div>

      {items.length === 0 ? (
        <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
          <p className="text-neutral-400">Your Watchlist is empty.</p>
          <p className="text-sm text-neutral-500 mt-2">Add videos from the Collection or Video Detail view.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {WATCHLIST_STATUSES.map(status => {
            const statusItems = items.filter(i => i.status === status);
            if (statusItems.length === 0) return null;
            return (
              <div key={status} className="space-y-3">
                <h3 className="font-semibold text-lg text-neutral-300 border-b border-neutral-800 pb-2">{status}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusItems.map(item => (
                    <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
                      <div className="space-y-2 mb-4">
                        <Link to={`/video/${item.videoId}`} className="font-medium text-neutral-200 hover:text-white transition-colors line-clamp-2">
                          {item.video?.title || item.video?.filename || 'Unknown Video'}
                        </Link>
                        {item.video?.performerDisplay && (
                          <div className="text-sm text-neutral-400">{item.video.performerDisplay}</div>
                        )}
                        <div className="flex gap-2 flex-wrap text-xs text-neutral-500 mt-2">
                          {item.video?.folder !== 'Unknown' && <span className="bg-neutral-800 px-2 py-0.5 rounded">{item.video?.folder}</span>}
                          {item.video?.personalRating && <span className="bg-neutral-800 px-2 py-0.5 rounded">★ {item.video.personalRating}</span>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-neutral-800/50 mt-auto">
                        <select 
                          value={item.status} 
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded px-2 py-1 outline-none"
                        >
                          {WATCHLIST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
