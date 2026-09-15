import React, { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { calculateAnalytics } from '../engines/analytics';
import { generateDiscovery } from '../engines/discovery';
import { DiscoveryMode, DiscoveryResult, DiscoveryOptions } from '../types/discovery';
import { FullAnalytics } from '../types/analytics';
import { Sparkles, RefreshCw, Plus, ArrowRight, Dices, EyeOff, FastForward, Info, Play, FolderSearch, Search, Layers, ListFilter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MODES: { id: DiscoveryMode; label: string; icon: any; desc: string }[] = [
  { id: 'Random', label: 'Random', icon: Dices, desc: 'Pure random selection.' },
  { id: 'Blind Pull', label: 'Blind Pull', icon: EyeOff, desc: 'Favor novelty, reduce repetition.' },
  { id: 'Rediscover', label: 'Rediscover', icon: RefreshCw, desc: 'Strong past sessions, not seen recently.' },
  { id: 'Unwatched', label: 'Unwatched', icon: FastForward, desc: 'Zero usages.' },
  { id: 'High Signal', label: 'High Signal', icon: Sparkles, desc: 'Strong observed evidence.' },
  { id: 'Deep Cut', label: 'Deep Cut', icon: Layers, desc: 'Overlooked areas of the collection.' },
  { id: 'Old Favorite', label: 'Old Favorite', icon: Play, desc: 'Established favorites, now stale.' },
  { id: 'Category Explorer', label: 'Category Explorer', icon: ListFilter, desc: 'Explore a specific dimension.' },
  { id: 'Gap Explorer', label: 'Gap Explorer', icon: FolderSearch, desc: 'Lightly represented areas with positive activity.' },
  { id: 'Surprise Me', label: 'Surprise Me', icon: Search, desc: 'A blend of novelty, rarity, and positive signals.' }
];

export default function Discovery() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [mode, setMode] = useState<DiscoveryMode>('Random');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Category Explorer State
  const [catType, setCatType] = useState<DiscoveryOptions['categoryType']>('Tag');
  const [catValue, setCatValue] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const videos = await Storage.getVideos();
    const sessions = await Storage.getSessions();
    const result = calculateAnalytics(videos, sessions);
    setAnalytics(result);
    setLoading(false);
  }

  function handleRunDiscovery() {
    if (!analytics) return;
    const opts: DiscoveryOptions = { categoryType: catType, categoryValue: catValue };
    const res = generateDiscovery(mode, analytics, opts);
    setResults(res);
    setCurrentIndex(0);
  }
  
  useEffect(() => {
    if (analytics && mode !== 'Category Explorer') {
      handleRunDiscovery();
    }
  }, [mode, analytics]);

  async function handleAddToWatchlist(videoId: string) {
    const wId = Date.now().toString();
    await Storage.saveWatchlistItem({
      id: wId,
      videoId,
      addedDate: new Date().toISOString(),
      status: 'To Watch',
      notes: ''
    });
    alert("Added to Watchlist!");
  }

  if (loading) return <div className="p-8 text-neutral-500">Initializing Discovery Engine...</div>;
  if (!analytics) return <div className="p-8 text-neutral-500">Failed to load analytics.</div>;

  const currentResult = results[currentIndex];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <Sparkles className="text-indigo-400" size={28} />
        <h2 className="text-3xl font-bold">Discovery</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Modes Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 px-2">Discovery Modes</h3>
          {MODES.map(m => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isActive ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-neutral-800 text-neutral-400'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Results Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">{mode}</h3>
            <p className="text-sm text-neutral-400 mb-6">{MODES.find(m => m.id === mode)?.desc}</p>
            
            {mode === 'Category Explorer' && (
              <div className="mb-6 p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-500">Category Type</label>
                    <select
                      value={catType}
                      onChange={(e) => {
                        setCatType(e.target.value as any);
                        setCatValue('');
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="Folder">Folder</option>
                      <option value="Participant Count">Participant Count</option>
                      <option value="Tag">Tag</option>
                      <option value="Performer">Performer</option>
                      <option value="Resolution">Resolution</option>
                      <option value="Vibe">Vibe</option>
                      <option value="Source">Source</option>
                    </select>
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-medium text-neutral-500">Value</label>
                    {catType === 'Folder' ? (
                       <select value={catValue} onChange={e => setCatValue(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                         <option value="">Select Folder</option>
                         {analytics.folders.map(f => <option key={f.folder} value={f.folder}>{f.folder}</option>)}
                       </select>
                    ) : catType === 'Tag' ? (
                       <select value={catValue} onChange={e => setCatValue(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                         <option value="">Select Tag</option>
                         {analytics.tags.map(t => <option key={t.tag} value={t.tag}>{t.tag}</option>)}
                       </select>
                    ) : catType === 'Performer' ? (
                       <select value={catValue} onChange={e => setCatValue(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                         <option value="">Select Performer</option>
                         {analytics.performers.map(p => <option key={p.performer} value={p.performer}>{p.performer}</option>)}
                       </select>
                    ) : (
                       <input 
                         type="text" 
                         value={catValue}
                         onChange={e => setCatValue(e.target.value)}
                         placeholder={`Enter ${catType}...`}
                         className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                       />
                    )}
                  </div>
                </div>
                <button
                  onClick={handleRunDiscovery}
                  disabled={!catType || !catValue}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Explore
                </button>
              </div>
            )}

            {!currentResult ? (
              <div className="py-12 text-center border-t border-neutral-800">
                <p className="text-neutral-500">No results found for this discovery mode.</p>
                {mode === 'Gap Explorer' && <p className="text-xs text-neutral-600 mt-2">Requires actionable opportunities in Analytics.</p>}
                {mode === 'Rediscover' && <p className="text-xs text-neutral-600 mt-2">Requires older, rated session history.</p>}
                {mode === 'Category Explorer' && !catValue && <p className="text-xs text-neutral-600 mt-2">Select a category and value to begin.</p>}
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Result Card */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Sparkles size={120} />
                   </div>
                   
                   <div className="relative z-10 space-y-4">
                     <div>
                       <div className="flex gap-2 items-center mb-2">
                         <span className="bg-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">
                           {currentResult.reasonType}
                         </span>
                         {currentResult.video.personalRating && (
                           <span className="bg-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                             ★ {currentResult.video.personalRating}
                           </span>
                         )}
                       </div>
                       <h4 className="text-2xl font-bold text-white pr-12 leading-tight">
                         {currentResult.video.title || currentResult.video.filename}
                       </h4>
                       <p className="text-sm text-neutral-400 mt-1">
                         {currentResult.video.performerDisplay || 'Unknown Performer'}
                       </p>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">
                          {currentResult.video.folder}
                        </span>
                        <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-300">
                          {currentResult.video.resolution}
                        </span>
                        {currentResult.video.originalTags && currentResult.video.originalTags.split(',').slice(0,4).map((t, i) => (
                          <span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-400">
                            {t.trim()}
                          </span>
                        ))}
                     </div>
                     
                     <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-lg mt-4">
                       <div className="flex items-center gap-2 text-indigo-400 mb-2">
                         <Info size={16} />
                         <span className="text-xs font-bold uppercase">Why this video?</span>
                       </div>
                       <p className="text-sm text-neutral-300 mb-2">{currentResult.reasonText}</p>
                       {currentResult.supportingSignals.length > 0 && (
                         <ul className="text-xs text-neutral-500 space-y-1 list-disc list-inside">
                           {currentResult.supportingSignals.map((sig, i) => (
                             <li key={i}>{sig}</li>
                           ))}
                         </ul>
                       )}
                     </div>
                   </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => handleAddToWatchlist(currentResult.videoId)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Plus size={18} /> Add to Watchlist
                  </button>
                  <Link
                    to={`/video/${currentResult.videoId}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
                  >
                    Open <ArrowRight size={18} />
                  </Link>
                  <div className="flex-1"></div>
                  <button
                    onClick={() => {
                      if (currentIndex < results.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                      } else {
                        handleRunDiscovery();
                      }
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
                  >
                    Next Suggestion <RefreshCw size={18} />
                  </button>
                </div>
                
                <div className="text-center text-xs text-neutral-600">
                  Result {currentIndex + 1} of {results.length}
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
