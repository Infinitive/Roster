import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Storage } from '../storage/db';
import { Session, Video } from '../types';
import { v4 as uuidv4 } from 'uuid';
import PageHeader from '../components/ui/PageHeader';
import { 
  Save, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  X, 
  Search, 
  Flame, 
  Star, 
  Zap, 
  Clock, 
  Film,
  Check
} from 'lucide-react';

const RATING_OPTIONS = [
  { val: 5, label: '5 — Nuclear / ruined me', short: '5 · Nuclear' },
  { val: 4, label: '4 — Very strong', short: '4 · Very strong' },
  { val: 3, label: '3 — Solid', short: '3 · Solid' },
  { val: 2, label: '2 — Meh', short: '2 · Meh' },
  { val: 1, label: '1 — Why did I bother', short: '1 · Regret' },
];

const ORGASM_OPTIONS = ['Came', 'Edged Only', 'Both', 'Neither'];

const VIBE_OPTIONS = [
  'Aggressive',
  'Worship',
  'Filthy',
  'Degrading',
  'Tender',
  'Chaotic',
  'Power',
  'Size-focused'
];

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
    try {
      const videos = await Storage.getVideos();
      setAllVideos(videos);

      if (id) {
        const existing = await Storage.getSession(id);
        if (existing) {
          setSession(existing);
        }
      } else {
        setSession(s => ({ 
          ...s, 
          id: `SES-${uuidv4()}`,
          videoIds: initialVideoId ? [initialVideoId] : []
        }));
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
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
    if (window.confirm('Are you sure you want to delete this session? This will update collection behavioral history.')) {
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
    setSession({ ...session, videoIds: session.videoIds.filter(vId => vId !== vid) });
  };

  const filteredPickerVideos = allVideos.filter(v => 
    !session.videoIds.includes(v.id) &&
    ((v.title || '').toLowerCase().includes(videoSearch.toLowerCase()) || 
     (v.filename || '').toLowerCase().includes(videoSearch.toLowerCase()) ||
     (v.performerDisplay || '').toLowerCase().includes(videoSearch.toLowerCase()) ||
     (v.originalTags || '').toLowerCase().includes(videoSearch.toLowerCase()))
  ).slice(0, 20);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Loading Session Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back to Sessions
        </button>

        {id && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 size={14} /> Delete Session
          </button>
        )}
      </div>

      <PageHeader
        title={id ? 'Edit Session' : 'Log Session'}
        icon={<Flame size={24} className="text-amber-500" />}
        subtitle="Capture now, enrich later. Everything except Date is optional."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Date & Duration */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
            Time & Duration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Date *</label>
              <input 
                type="date" 
                required
                value={session.date}
                onChange={e => setSession({...session, date: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500/80"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Duration (minutes)</label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g. 45"
                value={session.duration || ''}
                onChange={e => setSession({...session, duration: e.target.value ? parseInt(e.target.value) : null})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
              />
            </div>
          </div>
        </div>

        {/* Videos Used */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Videos Featured ({session.videoIds.length})
            </h3>
            {!isPickerOpen && (
              <button 
                type="button" 
                onClick={() => setIsPickerOpen(true)}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
              >
                <Plus size={14} /> Add Video
              </button>
            )}
          </div>

          {session.videoIds.length === 0 && !isPickerOpen && (
            <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
              No videos selected for this session yet.
            </div>
          )}

          {/* Selected Video Chips */}
          <div className="space-y-2">
            {session.videoIds.map(vidId => {
              const v = allVideos.find(item => item.id === vidId);
              return (
                <div
                  key={vidId}
                  className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Film size={14} className="text-zinc-500 flex-none" />
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {v?.performerDisplay ? `${v.performerDisplay} — ` : ''}
                      {v?.title || v?.filename || 'Unknown Video'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(vidId)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Video Picker Modal/Drawer */}
          {isPickerOpen && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 space-y-3 mt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search collection to add..." 
                    value={videoSearch}
                    onChange={e => setVideoSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                >
                  Cancel
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-zinc-800/40">
                {filteredPickerVideos.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => addVideo(v.id)}
                    className="w-full text-left p-2 hover:bg-zinc-800/60 rounded-lg text-xs text-zinc-300 flex items-center justify-between group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-zinc-200 block truncate">
                        {v.performerDisplay || 'Unknown'}
                      </span>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {v.title || v.filename}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 group-hover:bg-amber-500 group-hover:text-zinc-950 font-bold ml-2">
                      + Add
                    </span>
                  </button>
                ))}
                {filteredPickerVideos.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No matching videos found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rating, Vibe & Outcome */}
        <div className="p-5 rounded-2xl bg-[#121520] border border-zinc-800/80 space-y-5">
          {/* Rating */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Session Rating
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RATING_OPTIONS.map(opt => {
                const active = session.rating === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSession({ ...session, rating: active ? null : opt.val })}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                      active
                        ? 'bg-amber-950/60 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check size={14} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orgasm Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Orgasm Status
            </label>
            <div className="flex flex-wrap gap-2">
              {ORGASM_OPTIONS.map(status => {
                const active = session.orgasmStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSession({ ...session, orgasmStatus: active ? '' : status })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vibe / Energy */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
              Vibe / Energy
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map(vibe => {
                const active = session.vibe === vibe;
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => setSession({ ...session, vibe: active ? '' : vibe })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700 shadow-sm'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strong Combination */}
          <div className="pt-2 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setSession({ ...session, strongCombination: !session.strongCombination })}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                session.strongCombination
                  ? 'bg-indigo-950/60 border-indigo-700 text-indigo-200'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div>
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Zap size={14} className={session.strongCombination ? 'text-indigo-400' : 'text-zinc-500'} />
                  Mark as Strong Combination
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  These videos worked exceptionally well together.
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  session.strongCombination
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'border-zinc-700'
                }`}
              >
                {session.strongCombination && <Check size={13} strokeWidth={3} />}
              </div>
            </button>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Notes (optional)</label>
            <textarea 
              value={session.notes}
              onChange={e => setSession({...session, notes: e.target.value})}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80"
              placeholder="Any thoughts or observations about this session..."
            />
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-950/30 transition-all active:scale-98"
        >
          <Save size={18} />
          <span>Save Session</span>
        </button>
      </form>
    </div>
  );
}
