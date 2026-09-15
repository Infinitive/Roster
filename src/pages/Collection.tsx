import { useState, useEffect } from 'react';
import { Storage } from '../storage/db';
import { Video } from '../types';
import { Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Collection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Phase 1 minimal filter state
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [selectedResolution, setSelectedResolution] = useState<string>('All');

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
    
    return matchesSearch && matchesFolder && matchesRes;
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Inventory ({filteredVideos.length})</h2>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search title, performer, tags..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all text-white placeholder-neutral-500"
            />
          </div>
          
          <select 
            value={selectedFolder} 
            onChange={e => setSelectedFolder(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
          >
            {folders.map(f => <option key={f} value={f}>{f === 'All' ? 'All Folders' : f}</option>)}
          </select>
          
          <select 
            value={selectedResolution} 
            onChange={e => setSelectedResolution(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neutral-600 text-white"
          >
            {resolutions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Resolutions' : r}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-xl">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading collection...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No videos found matching your filters.</div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {filteredVideos.map(video => (
              <div key={video.id} className="p-4 hover:bg-neutral-800/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link to={`/video/${video.id}`} className="font-medium text-neutral-200 hover:text-white transition-colors truncate block">
                    {video.title || video.filename}
                  </Link>
                  <div className="text-sm text-neutral-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {video.performerDisplay && <span><span className="text-neutral-600">P:</span> {video.performerDisplay}</span>}
                    {video.participantCount !== 'Unknown' && <span><span className="text-neutral-600">Count:</span> {video.participantCount}</span>}
                    {video.resolution !== 'Unknown' && <span><span className="text-neutral-600">Res:</span> {video.resolution}</span>}
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
