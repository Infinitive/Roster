import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types';
import Badge from './Badge';
import PlayButton from './PlayButton';
import { 
  Bookmark, 
  BookmarkCheck, 
  PlaySquare, 
  Star, 
  AlertTriangle, 
  HelpCircle,
  Flame
} from 'lucide-react';

interface CompactMediaRowProps {
  key?: React.Key;
  video: Video;
  inWatchlist?: boolean;
  onToggleWatchlist?: (videoId: string) => void;
  timesWatched?: number;
  rankNumber?: number | string;
}

export default function CompactMediaRow({
  video,
  inWatchlist = false,
  onToggleWatchlist,
  timesWatched = 0,
  rankNumber
}: CompactMediaRowProps) {
  const initials = (video.performerDisplay || video.title || 'RO')
    .split(/[\s&,/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'RO';

  return (
    <div className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-zinc-800/40 border-b border-zinc-800/60 transition-colors gap-3 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {rankNumber && (
          <span className="font-mono text-xs font-black text-amber-400/80 tracking-tighter w-5 text-center flex-none">
            {typeof rankNumber === 'number' ? String(rankNumber).padStart(2, '0') : rankNumber}
          </span>
        )}

        {/* Monogram */}
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/70 flex items-center justify-center text-xs font-bold font-mono text-zinc-300 flex-none group-hover:border-amber-500/50">
          {initials}
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/video/${video.id}`}
              className="text-sm font-bold text-zinc-200 hover:text-amber-300 transition-colors truncate"
            >
              {video.performerDisplay || 'Unknown Performers'}
            </Link>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md">
              {video.title || video.filename}
            </span>

            {video.datasetType === 'real' && (
              <Badge variant="real" size="xs">
                Verified
              </Badge>
            )}
            {video.flags?.includes('research-needed') && (
              <Badge variant="research" size="xs" icon={<HelpCircle size={9} />}>
                Research
              </Badge>
            )}
            {video.flags?.includes('participant-folder-mismatch') && (
              <Badge variant="mismatch" size="xs" icon={<AlertTriangle size={9} />}>
                Mismatch
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-500 mt-0.5 flex-wrap font-mono">
            <span className="text-zinc-400">{video.folder}</span>
            {video.resolution && video.resolution !== 'Unknown' && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="text-emerald-400/90">{video.resolution}</span>
              </>
            )}
            {video.originalTags && (
              <>
                <span className="text-zinc-700">/</span>
                <span className="text-zinc-500 truncate max-w-xs">{video.originalTags}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-2 flex-none font-mono">
        <PlayButton video={video} size="xs" variant="primary" />

        {video.personalRating && (
          <span className="flex items-center gap-1 text-amber-400 text-xs font-bold px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/40">
            <Star size={10} className="fill-amber-400" />
            {video.personalRating}
          </span>
        )}

        {timesWatched > 0 && (
          <span className="text-[11px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {timesWatched}x
          </span>
        )}

        {onToggleWatchlist && (
          <button
            type="button"
            onClick={() => onToggleWatchlist(video.id)}
            title={inWatchlist ? 'In Queue' : 'Add to Queue'}
            className={`p-1.5 rounded-md transition-colors ${
              inWatchlist ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
        )}

        <Link
          to={`/sessions/new?videoId=${video.id}`}
          title="Log Session"
          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
        >
          <Flame size={14} />
        </Link>

        <Link
          to={`/video/${video.id}`}
          className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          View
        </Link>
      </div>
    </div>
  );
}
