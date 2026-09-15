import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { Session, Video } from '../types';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';

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
    const dbSessions = await Storage.getSessions();
    const dbVideos = await Storage.getVideos();
    
    // Sort by date desc
    dbSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const populated = dbSessions.map(s => ({
      ...s,
      videoDetails: s.videoIds.map(vid => dbVideos.find(v => v.id === vid)).filter(Boolean) as Video[]
    }));
    
    setSessions(populated);
    setLoading(false);
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Sessions ({sessions.length})</h2>
        <Link 
          to="/sessions/new" 
          className="flex items-center gap-2 bg-white text-neutral-900 hover:bg-neutral-200 font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={18} />
          Log Session
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-xl">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-400">No sessions logged yet.</p>
            <p className="text-sm text-neutral-500 mt-2">Log a session to track your behavioral history.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {sessions.map(session => (
              <Link key={session.id} to={`/sessions/${session.id}`} className="block p-5 hover:bg-neutral-800/30 transition-colors">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-white">{new Date(session.date).toLocaleDateString()}</span>
                      {session.rating && <span className="text-sm font-medium text-yellow-500">★ {session.rating}</span>}
                      {session.duration && <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">{session.duration} min</span>}
                      {session.strongCombination && <span className="text-[10px] uppercase tracking-wider bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/50">Strong Combo</span>}
                    </div>
                    
                    <div className="text-sm text-neutral-400">
                      <span className="text-neutral-500 mr-2">{session.videoIds.length} video(s):</span>
                      {session.videoDetails.map(v => v.title || v.filename).join(', ')}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap text-xs text-neutral-500">
                      {session.orgasmStatus && <span>Status: <span className="text-neutral-300">{session.orgasmStatus}</span></span>}
                      {session.vibe && <span>Vibe: <span className="text-neutral-300">{session.vibe}</span></span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
