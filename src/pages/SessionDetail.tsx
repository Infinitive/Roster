import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Session, Video } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Save, ArrowLeft, Trash2, Plus, X, Search } from 'lucide-react';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialVideoId = searchParams.get('videoId');
  
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    duration: null,
    videoIds: initialVideoId ? [initialVideoId] : [],
    rating: null,
    orgasmStatus: '',
    vibe: '',
    strongCombination: false,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Video picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const videos = await Storage.getVideos();
    setAllVideos(videos);

    if (id) {
      const existing = await Storage.getSession(id);
      if (existing) {
        setSession(existing);
      }
    } else {
      setSession(s => ({ ...s, id: `SES-${uuidv4()}` }));
    }
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await Storage.saveSession({
      ...session,
      updatedAt: Date.now()
    });
    navigate('/sessions');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this session? This will update watch history.')) {
      await Storage.deleteSession(session.id);
      navigate('/sessions');
    }
  };

  const addVideo = (vid: string) => {
    if (!session.videoIds.includes(vid)) {
      setSession({ ...session, videoIds: [...session.videoIds, vid] });
    }
    setIsPickerOpen(false);
    setVideoSearch('');
  };

  const removeVideo = (vid: string) => {
    setSession({ ...session, videoIds: session.videoIds.filter(id => id !== vid) });
  };

  const filteredPickerVideos = allVideos.filter(v => 
    !session.videoIds.includes(v.id) &&
    (v.title.toLowerCase().includes(videoSearch.toLowerCase()) || 
     v.filename.toLowerCase().includes(videoSearch.toLowerCase()) ||
     v.originalTags.toLowerCase().includes(videoSearch.toLowerCase()))
  ).slice(0, 20); // show top 20 matches

  if (loading) return <div className="p-8 text-neutral-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>
        {id && (
          <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{id ? 'Edit Session' : 'Log Session'}</h2>
        <p className="text-sm text-neutral-400">Capture what matters. Everything is optional except Date.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">Date *</label>
              <input 
                type="date" 
                required
                value={session.date}
                onChange={e => setSession({...session, date: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">Duration (minutes)</label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g. 45"
                value={session.duration || ''}
                onChange={e => setSession({...session, duration: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white placeholder-neutral-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-300">Videos Used</label>
              {!isPickerOpen && (
                <button 
                  type="button" 
                  onClick={() => setIsPickerOpen(true)}
                  className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add Video
                </button>
              )}
            </div>
            
            {session.videoIds.length === 0 && !isPickerOpen && (
              <div className="p-4 border border-dashed border-neutral-700 rounded-lg text-center text-sm text-neutral-500">
                No videos selected.
              </div>
            )}

            <div className="space-y-2">
              {session.videoIds.map(vidId => {
                const v = allVideos.find(v => v.id === vidId);
                return (
                  <div key={vidId} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 p-2.5 rounded-lg">
                    <div className="text-sm text-neutral-200 truncate pr-4">
                      {v?.title || v?.filename || 'Unknown Video'}
                    </div>
                    <button type="button" onClick={() => removeVideo(vidId)} className="text-neutral-500 hover:text-red-400">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {isPickerOpen && (
              <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search to add video..." 
                      value={videoSearch}
                      onChange={e => setVideoSearch(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-8 py-1.5 text-sm focus:outline-none focus:border-neutral-600 text-white"
                    />
                  </div>
                  <button type="button" onClick={() => setIsPickerOpen(false)} className="text-xs text-neutral-400 hover:text-white">Cancel</button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredPickerVideos.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => addVideo(v.id)}
                      className="w-full text-left p-2 hover:bg-neutral-800 rounded text-sm text-neutral-300 truncate"
                    >
                      {v.title || v.filename}
                    </button>
                  ))}
                  {filteredPickerVideos.length === 0 && (
                    <div className="p-2 text-xs text-neutral-500">No matching videos found.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">Session Rating</label>
              <select 
                value={session.rating || ''} 
                onChange={e => setSession({...session, rating: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
              >
                <option value="">Select rating (optional)</option>
                <option value="5">5 — Nuclear / ruined me</option>
                <option value="4">4 — Very strong</option>
                <option value="3">3 — Solid</option>
                <option value="2">2 — Meh</option>
                <option value="1">1 — Why did I bother</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">Orgasm Status</label>
              <select 
                value={session.orgasmStatus} 
                onChange={e => setSession({...session, orgasmStatus: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
              >
                <option value="">Select status (optional)</option>
                <option value="Came">Came</option>
                <option value="Edged Only">Edged Only</option>
                <option value="Both">Both</option>
                <option value="Neither">Neither</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-300">Vibe / Energy</label>
              <select 
                value={session.vibe} 
                onChange={e => setSession({...session, vibe: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
              >
                <option value="">Select vibe (optional)</option>
                <option value="Aggressive">Aggressive</option>
                <option value="Worship">Worship</option>
                <option value="Filthy">Filthy</option>
                <option value="Degrading">Degrading</option>
                <option value="Tender">Tender</option>
                <option value="Chaotic">Chaotic</option>
                <option value="Power">Power</option>
                <option value="Size-focused">Size-focused</option>
              </select>
            </div>
            <div className="space-y-1 flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input 
                  type="checkbox"
                  checked={session.strongCombination}
                  onChange={e => setSession({...session, strongCombination: e.target.checked})}
                  className="rounded border-neutral-600 bg-neutral-900 text-indigo-500 focus:ring-indigo-500/50"
                />
                <span className="text-sm font-medium text-neutral-300">Strong Combination</span>
              </label>
              <p className="text-xs text-neutral-500 ml-6">These videos worked exceptionally well together.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">Notes</label>
            <textarea 
              value={session.notes}
              onChange={e => setSession({...session, notes: e.target.value})}
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white placeholder-neutral-600"
              placeholder="Any additional thoughts? (optional)"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-neutral-200 hover:bg-white text-neutral-900 font-medium px-6 py-3 rounded-xl transition-colors"
        >
          <Save size={18} />
          Save Session
        </button>
      </form>
    </div>
  );
}
