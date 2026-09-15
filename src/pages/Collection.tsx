import { useState, useEffect, useMemo } from 'react';
import { Storage } from '../storage/db';
import { Video, Session, WatchlistItem } from '../types';
import { calculateVideoHistory, WatchHistory } from '../engines/history';
import MediaCard from '../components/ui/MediaCard';
import CompactMediaRow from '../components/ui/CompactMediaRow';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Filter, 
  X, 
  ArrowUpDown, 
  Plus, 
  Star, 
  FolderTree, 
  HelpCircle, 
  AlertTriangle,
  HardDrive,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'performer' | 'title' | 'rating' | 'watched' | 'lastWatched';

export default function Collection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Search and Filters
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedResolution, setSelectedResolution] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [watchFilter, setWatchFilter] = useState<'all' | 'watched' | 'unwatched' | 'watchlist'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Filter drawer toggle on mobile
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  useEffect(() => {
    loadLibraryData();
  }, []);

  async function loadLibraryData() {
    setLoading(true);
    try {
      const [vids, sess, wl] = await Promise.all([
        Storage.getVideos(),
        Storage.getSessions(),
        Storage.getWatchlist()
      ]);
      setVideos(vids);
      setSessions(sess);
      setWatchlist(wl);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  }

  // Pre-calculate video histories
  const historiesMap = useMemo(() => {
    const map = new Map<string, WatchHistory>();
    videos.forEach(v => {
      map.set(v.id, calculateVideoHistory(v.id, sessions));
    });
    return map;
  }, [videos, sessions]);

  // Derive available filter sets
  const availableFolders = useMemo(() => {
    return ['All', ...Array.from(new Set(videos.map(v => v.folder))).filter(Boolean).sort()];
  }, [videos]);

  const availableResolutions = useMemo(() => {
    return ['All', ...Array.from(new Set(videos.map(v => v.resolution))).filter(Boolean).sort()];
  }, [videos]);

  // Toggle watchlist item
  const handleToggleWatchlist = async (videoId: string) => {
    const existing = watchlist.find(w => w.videoId === videoId);
    if (existing) {
      await Storage.deleteWatchlistItem(existing.id);
      setWatchlist(prev => prev.filter(w => w.id !== existing.id));
    } else {
      const newItem: WatchlistItem = {
        id: `WL-${uuidv4()}`,
        videoId,
        status: 'Queue',
        addedDate: new Date().toISOString(),
        notes: ''
      };
      await Storage.saveWatchlistItem(newItem);
      setWatchlist(prev => [...prev, newItem]);
    }
  };

  // Reset all active filters
  const resetFilters = () => {
    setSearch('');
    setSelectedFolder('All');
    setSelectedResolution('All');
    setStatusFilter('All');
    setWatchFilter('all');
    setRatingFilter('all');
    setSortBy('recent');
  };

  // Check active filter count
  const activeFilterCount = (
    (selectedFolder !== 'All' ? 1 : 0) +
    (selectedResolution !== 'All' ? 1 : 0) +
    (statusFilter !== 'All' ? 1 : 0) +
    (watchFilter !== 'all' ? 1 : 0) +
    (ratingFilter !== 'all' ? 1 : 0) +
    (search ? 1 : 0)
  );

  // Filter & sort logic
  const filteredVideos = useMemo(() => {
    const sLower = search.trim().toLowerCase();

    const result = videos.filter(v => {
      // Search
      if (sLower) {
        const matchesTitle = (v.title || '').toLowerCase().includes(sLower);
        const matchesFilename = (v.filename || '').toLowerCase().includes(sLower);
        const matchesPerformer = (v.performerDisplay || '').toLowerCase().includes(sLower);
        const matchesTags = (v.originalTags || '').toLowerCase().includes(sLower);
        const matchesFolder = (v.folder || '').toLowerCase().includes(sLower);
        if (!matchesTitle && !matchesFilename && !matchesPerformer && !matchesTags && !matchesFolder) {
          return false;
        }
      }

      // Folder
      if (selectedFolder !== 'All' && v.folder !== selectedFolder) {
        return false;
      }

      // Resolution
      if (selectedResolution !== 'All' && v.resolution !== selectedResolution) {
        return false;
      }

      // Status
      if (statusFilter === 'Research Needed') {
        const needsResearch = v.flags?.includes('research-needed') || v.performerDisplay === 'Unknown';
        if (!needsResearch) return false;
      } else if (statusFilter === 'Mismatch') {
        if (!v.flags?.includes('participant-folder-mismatch')) return false;
      } else if (statusFilter === 'Real Dataset') {
        if (v.datasetType !== 'real') return false;
      } else if (statusFilter === 'Seed Dataset') {
        if (v.datasetType === 'real') return false;
      }

      // Watch status
      const hist = historiesMap.get(v.id);
      const isWatched = (hist?.timesWatched || 0) > 0;
      const inWl = watchlist.some(w => w.videoId === v.id);

      if (watchFilter === 'watched' && !isWatched) return false;
      if (watchFilter === 'unwatched' && isWatched) return false;
      if (watchFilter === 'watchlist' && !inWl) return false;

      // Rating
      if (ratingFilter !== 'all') {
        if ((v.personalRating || 0) < ratingFilter) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (sortBy === 'performer') {
        return (a.performerDisplay || '').localeCompare(b.performerDisplay || '');
      }
      if (sortBy === 'title') {
        return (a.title || a.filename).localeCompare(b.title || b.filename);
      }
      if (sortBy === 'rating') {
        return (b.personalRating || 0) - (a.personalRating || 0);
      }
      if (sortBy === 'watched') {
        const countA = historiesMap.get(a.id)?.timesWatched || 0;
        const countB = historiesMap.get(b.id)?.timesWatched || 0;
        return countB - countA;
      }
      if (sortBy === 'lastWatched') {
        const lastA = historiesMap.get(a.id)?.lastWatched ? new Date(historiesMap.get(a.id)!.lastWatched!).getTime() : 0;
        const lastB = historiesMap.get(b.id)?.lastWatched ? new Date(historiesMap.get(b.id)!.lastWatched!).getTime() : 0;
        return lastB - lastA;
      }
      return 0;
    });

    return result;
  }, [videos, search, selectedFolder, selectedResolution, statusFilter, watchFilter, ratingFilter, sortBy, historiesMap, watchlist]);

  const realCount = videos.filter(v => v.datasetType === 'real').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono">Loading Library Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Library"
        badge={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filteredVideos.length} / {videos.length}
            </span>
            {realCount > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/50">
                {realCount} Real
              </span>
            )}
          </div>
        }
        subtitle="Private video archive metadata, physical hierarchy, and provenance."
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Compact List View"
              >
                <List size={16} />
              </button>
            </div>

            {/* Quick Add Link */}
            <Link
              to="/quick-add"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Add Video</span>
            </Link>
          </div>
        }
      />

      {/* Control Bar: Search + Quick Category Pills + Filter Trigger */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search title, performer, tags, resolution, folder..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#121520] border border-zinc-800/90 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Drawer Toggle on Mobile / Compact */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              activeFilterCount > 0
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/70 shadow-sm'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-zinc-900/90 border border-zinc-800 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer h-full"
            >
              <option value="recent">Recently Added</option>
              <option value="performer">Performer A-Z</option>
              <option value="title">Title A-Z</option>
              <option value="rating">Rating (Highest)</option>
              <option value="watched">Most Watched</option>
              <option value="lastWatched">Recently Watched</option>
            </select>
            <ArrowUpDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Quick Shortcut Folder / Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['All', '0 Favorites', '1 Solo', '2 Duo', '3 Threesome', '4(+) Group'].map(f => {
            const isSelected = selectedFolder === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFolder(isSelected && f !== 'All' ? 'All' : f)}
                className={`text-xs px-3 py-1 rounded-lg border font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-zinc-800 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {f}
              </button>
            );
          })}

          <div className="w-[1px] h-4 bg-zinc-800 mx-1 flex-none" />

          {/* Quick status chips */}
          <button
            type="button"
            onClick={() => setWatchFilter(watchFilter === 'unwatched' ? 'all' : 'unwatched')}
            className={`text-xs px-3 py-1 rounded-lg border font-medium whitespace-nowrap transition-all ${
              watchFilter === 'unwatched'
                ? 'bg-zinc-800 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            Fresh / Unwatched
          </button>

          <button
            type="button"
            onClick={() => setWatchFilter(watchFilter === 'watchlist' ? 'all' : 'watchlist')}
            className={`text-xs px-3 py-1 rounded-lg border font-medium whitespace-nowrap transition-all ${
              watchFilter === 'watchlist'
                ? 'bg-amber-950/50 text-amber-300 border-amber-800'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            In Watchlist ({watchlist.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Research Needed' ? 'All' : 'Research Needed')}
            className={`text-xs px-3 py-1 rounded-lg border font-medium whitespace-nowrap transition-all ${
              statusFilter === 'Research Needed'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            Research Needed
          </button>
        </div>

        {/* Detailed Collapsible Filter Panel */}
        {showFilterDrawer && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121520] border border-zinc-800/90 shadow-xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Collection Filter Parameters
                </h3>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} />
                <span>Reset all filters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Folder Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Physical Folder
                </label>
                <select
                  value={selectedFolder}
                  onChange={e => setSelectedFolder(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  {availableFolders.map(f => (
                    <option key={f} value={f}>
                      {f === 'All' ? 'All Folders' : f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolution Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Resolution
                </label>
                <select
                  value={selectedResolution}
                  onChange={e => setSelectedResolution(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  {availableResolutions.map(r => (
                    <option key={r} value={r}>
                      {r === 'All' ? 'All Resolutions' : r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status / Provenance */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Provenance & Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="All">All Provenance</option>
                  <option value="Research Needed">Research Needed</option>
                  <option value="Mismatch">Folder / Count Mismatch</option>
                  <option value="Real Dataset">Real Physical Inventory</option>
                  <option value="Seed Dataset">Sample Seed Dataset</option>
                </select>
              </div>

              {/* Personal Rating Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                  Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="all">Any Rating</option>
                  <option value="5">★ 5 Stars Only</option>
                  <option value="4">★ 4 Stars & Above</option>
                  <option value="3">★ 3 Stars & Above</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags Row */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">Active:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Search: "{search}"
                <button onClick={() => setSearch('')}><X size={12} /></button>
              </span>
            )}
            {selectedFolder !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Folder: {selectedFolder}
                <button onClick={() => setSelectedFolder('All')}><X size={12} /></button>
              </span>
            )}
            {selectedResolution !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Res: {selectedResolution}
                <button onClick={() => setSelectedResolution('All')}><X size={12} /></button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('All')}><X size={12} /></button>
              </span>
            )}
            {watchFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Activity: {watchFilter}
                <button onClick={() => setWatchFilter('all')}><X size={12} /></button>
              </span>
            )}
            {ratingFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                Rating: ★ {ratingFilter}+
                <button onClick={() => setRatingFilter('all')}><X size={12} /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-amber-400 hover:text-amber-300 text-[11px] underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Results Listing */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No matching collection records"
          description={
            videos.length === 0
              ? "Your T9 registry has no videos registered yet. Ingest your physical inventory in Settings or Quick Add individual videos."
              : "No videos match your active filter and search criteria. Try clearing some filters or searching for another term."
          }
          action={
            videos.length === 0 ? (
              <Link
                to="/quick-add"
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs"
              >
                Quick Add Video
              </Link>
            ) : (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                Reset All Filters
              </button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredVideos.map(video => {
            const hist = historiesMap.get(video.id);
            return (
              <MediaCard
                key={video.id}
                video={video}
                inWatchlist={watchlist.some(w => w.videoId === video.id)}
                onToggleWatchlist={handleToggleWatchlist}
                timesWatched={hist?.timesWatched || 0}
                lastWatchedDaysAgo={hist?.daysSinceLastWatched || null}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#121520] border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
          {filteredVideos.map(video => {
            const hist = historiesMap.get(video.id);
            return (
              <CompactMediaRow
                key={video.id}
                video={video}
                inWatchlist={watchlist.some(w => w.videoId === video.id)}
                onToggleWatchlist={handleToggleWatchlist}
                timesWatched={hist?.timesWatched || 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
