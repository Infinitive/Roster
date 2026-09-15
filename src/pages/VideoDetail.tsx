import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Video, Session, WatchlistItem } from '../types';
import { calculateVideoHistory, WatchHistory } from '../engines/history';
import { Bookmark, BookmarkMinus, Edit, PlaySquare, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [history, setHistory] = useState<WatchHistory | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  async function loadData(videoId: string) {
    setLoading(true);
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
    
    setLoading(false);
  }

  async function toggleWatchlist() {
    if (watchlistStatus && watchlistItemId) {
      await Storage.deleteWatchlistItem(watchlistItemId);
      setWatchlistStatus(null);
      setWatchlistItemId(null);
    } else {
      const newItem: WatchlistItem = {
        id: `WL-${uuidv4()}`,
        videoId: video!.id,
        status: 'Queue',
        addedDate: new Date().toISOString(),
        notes: ''
      };
      await Storage.saveWatchlistItem(newItem);
      setWatchlistStatus(newItem.status);
      setWatchlistItemId(newItem.id);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return <div className="p-8 text-neutral-500">Loading...</div>;
  if (!video) return <div className="p-8 text-neutral-500">Video not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{video.title || video.filename}</h2>
          <div className="text-sm text-neutral-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{video.performerDisplay || 'No Performers'}</span>
            {video.personalRating && <span className="text-yellow-500 font-medium">★ {video.personalRating}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleWatchlist}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              watchlistStatus ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {watchlistStatus ? <BookmarkMinus size={16} /> : <Bookmark size={16} />}
            {watchlistStatus || 'Watchlist'}
          </button>
          <Link to={`/sessions/new?videoId=${video.id}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-200 text-neutral-900 hover:bg-white transition-colors">
            <PlaySquare size={16} /> Log Session
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Physical Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Folder</p>
                <p className="text-neutral-200">{video.folder}</p>
              </div>
              <div>
                <p className="text-neutral-500">Participant Count</p>
                <p className="text-neutral-200">{video.participantCount}</p>
              </div>
              <div>
                <p className="text-neutral-500">Resolution</p>
                <p className="text-neutral-200">{video.resolution}</p>
              </div>
              <div>
                <p className="text-neutral-500">Date Added</p>
                <p className="text-neutral-200">{video.dateAdded}</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-neutral-500 text-sm">Location</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-neutral-950 px-2 py-1 rounded text-neutral-400 break-all w-full">{video.relativePath}</code>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Semantic Metadata</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-neutral-500">Tags</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {video.originalTags ? video.originalTags.split(',').map((t, i) => (
                    <span key={i} className="bg-neutral-800 px-2 py-1 rounded text-neutral-300">{t.trim()}</span>
                  )) : <span className="text-neutral-600">None</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-neutral-500">Vibe</p>
                  <p className="text-neutral-200">{video.vibe || 'Unspecified'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Source</p>
                  <p className="text-neutral-200">{video.source || 'Unknown'}</p>
                </div>
              </div>
              {video.notes && (
                <div>
                  <p className="text-neutral-500">Notes</p>
                  <p className="text-neutral-300 mt-1">{video.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Times Watched</span>
                <span className="font-medium text-white">{history?.timesWatched || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Last Watched</span>
                <span className="font-medium text-white">{history?.lastWatched ? new Date(history.lastWatched).toLocaleDateString() : 'Never'}</span>
              </div>
              {history?.daysSinceLastWatched !== null && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Days Since</span>
                  <span className="font-medium text-white">{history.daysSinceLastWatched}</span>
                </div>
              )}
              {history?.averageSessionRating && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Avg Session ★</span>
                  <span className="font-medium text-yellow-500">{history.averageSessionRating}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Related Sessions</h3>
            {history?.sessionsInvolved && history.sessionsInvolved.length > 0 ? (
              <div className="space-y-2">
                {history.sessionsInvolved.map(session => (
                  <Link key={session.id} to={`/sessions/${session.id}`} className="block bg-neutral-950 border border-neutral-800 p-3 rounded-lg hover:border-neutral-600 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-neutral-200">{new Date(session.date).toLocaleDateString()}</span>
                      {session.rating && <span className="text-xs text-yellow-500 font-medium">★ {session.rating}</span>}
                    </div>
                    {session.strongCombination && (
                      <span className="text-[10px] uppercase tracking-wider bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded">Strong Combo</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No sessions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
