import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { Video } from '../types';
import { Search, Eye, AlertTriangle, HelpCircle, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Collection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedResolution, setSelectedResolution] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    const data = await Storage.getVideos();
    setVideos(data);
    setLoading(false);
  }

  // Derive filter options
  const folders = ['All', ...Array.from(new Set(videos.map(v => v.folder))).filter(Boolean).sort()];
  const resolutions = ['All', ...Array.from(new Set(videos.map(v => v.resolution))).filter(Boolean).sort()];

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase()) || 
                          v.performerDisplay.toLowerCase().includes(search.toLowerCase()) ||
                          v.originalTags.toLowerCase().includes(search.toLowerCase());
    
    const matchesFolder = selectedFolder === 'All' || v.folder === selectedFolder;
    const matchesRes = selectedResolution === 'All' || v.resolution === selectedResolution;
    
    let matchesStatus = true;
    if (statusFilter === 'Research Needed') {
      matchesStatus = !!v.flags?.includes('research-needed') || v.performerDisplay === 'Unknown';
    } else if (statusFilter === 'Mismatch') {
      matchesStatus = !!v.flags?.includes('participant-folder-mismatch');
    } else if (statusFilter === 'Real Dataset') {
      matchesStatus = v.datasetType === 'real';
    } else if (statusFilter === 'Seed Dataset') {
      matchesStatus = v.datasetType === 'seed' || !v.datasetType;
    }

    return matchesSearch && matchesFolder && matchesRes && matchesStatus;
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory ({filteredVideos.length})</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Physical metadata & provenance registry</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input 
              type="text" 
              placeholder="Search title, performer, tags..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-neutral-600 text-white placeholder-neutral-500"
            />
          </div>
          
          <select 
            value={selectedFolder} 
            onChange={e => setSelectedFolder(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neutral-600 text-white"
          >
            {folders.map(f => <option key={f} value={f}>{f === 'All' ? 'All Folders' : f}</option>)}
          </select>
          
          <select 
            value={selectedResolution} 
            onChange={e => setSelectedResolution(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neutral-600 text-white"
          >
            {resolutions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Resolutions' : r}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-neutral-600 text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Research Needed">Research Needed</option>
            <option value="Mismatch">Folder/Count Mismatch</option>
            <option value="Real Dataset">Real Dataset</option>
            <option value="Seed Dataset">Seed / Sample Dataset</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-xl">
        {loading ? (
          <div className="p-8 text-center text-neutral-500 text-sm">Loading collection...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">No videos found matching your filters.</div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {filteredVideos.map(video => (
              <div key={video.id} className="p-4 hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/video/${video.id}`} className="font-medium text-neutral-200 hover:text-white transition-colors truncate">
                      {video.title || video.filename}
                    </Link>
                    {video.datasetType === 'real' && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50">
                        Real
                      </span>
                    )}
                    {video.flags?.includes('research-needed') && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                        <HelpCircle size={10} /> Research
                      </span>
                    )}
                    {video.flags?.includes('participant-folder-mismatch') && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/50 flex items-center gap-1">
                        <AlertTriangle size={10} /> Mismatch
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {video.performerDisplay && (
                      <span>
                        <span className="text-neutral-600">P:</span> {video.performerDisplay}
                      </span>
                    )}
                    {video.participantCount !== 'Unknown' && (
                      <span>
                        <span className="text-neutral-600">Count:</span> {video.participantCount}
                      </span>
                    )}
                    {video.resolution !== 'Unknown' && (
                      <span>
                        <span className="text-neutral-600">Res:</span> {video.resolution}
                      </span>
                    )}
                    <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={video.originalTags}>
                      <span className="text-neutral-600">Tags:</span> {video.originalTags || 'None'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-none flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                  <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                    {video.folder}
                  </span>
                  <Link to={`/video/${video.id}`} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                    <Eye size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
