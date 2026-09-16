import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types';
import Badge from './Badge';
import TagChip from './TagChip';
import PlayButton from './PlayButton';
import { 
  Bookmark, 
  BookmarkCheck, 
  PlaySquare, 
  Star, 
  Eye, 
  AlertTriangle, 
  HelpCircle,
  Flame
} from 'lucide-react';

interface MediaCardProps {
  key?: React.Key;
  video: Video;
  inWatchlist?: boolean;
  onToggleWatchlist?: (videoId: string) => void;
  timesWatched?: number;
  lastWatchedDaysAgo?: number | null;
  className?: string;
  rankNumber?: number | string;
}

export default function MediaCard({
  video,
  inWatchlist = false,
  onToggleWatchlist,
  timesWatched = 0,
  lastWatchedDaysAgo = null,
  className = '',
  rankNumber
}: MediaCardProps) {
  // Extract initials for the architectural header monogram
  const initials = (video.performerDisplay || video.title || 'RO')
    .split(/[\s&,/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'RO';

  // Parse tag strings into list
  const tagList = video.originalTags
    ? video.originalTags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl bg-[#10121a] border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 hover:shadow-xl hover:shadow-black/50 overflow-hidden ${className}`}
    >
      {/* Top Media Header / Visual Monogram Band */}
      <div className="relative p-3.5 pb-2.5 bg-gradient-to-b from-[#151824] to-[#10121a] border-b border-zinc-800/70">
        <div className="flex items-start justify-between gap-2.5 mb-2">
          {/* Rank Number & Avatar Monogram */}
          <div className="flex items-center gap-2.5 min-w-0">
            {rankNumber && (
              <span className="font-mono text-xs font-black text-amber-400 tracking-tighter w-5 text-center flex-none">
                {typeof rankNumber === 'number' ? String(rankNumber).padStart(2, '0') : rankNumber}
              </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/70 flex items-center justify-center text-xs font-bold font-mono tracking-wider text-zinc-200 group-hover:border-amber-500/50 transition-colors shadow-inner flex-none">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block truncate font-mono">
                {video.folder || 'Folder'}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {video.participantCount && video.participantCount !== 'Unknown' ? `${video.participantCount} Participant` : ''}
              </span>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex items-center gap-1.5 flex-none">
            {video.resolution && video.resolution !== 'Unknown' && (
              <Badge variant="resolution" size="xs">
                {video.resolution}
              </Badge>
            )}
            {video.datasetType === 'real' && (
              <Badge variant="real" size="xs">
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Warning Badges if any */}
        {(video.flags?.includes('research-needed') || video.flags?.includes('participant-folder-mismatch')) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {video.flags?.includes('research-needed') && (
              <Badge variant="research" size="xs" icon={<HelpCircle size={10} />}>
                Research Needed
              </Badge>
            )}
            {video.flags?.includes('participant-folder-mismatch') && (
              <Badge variant="mismatch" size="xs" icon={<AlertTriangle size={10} />}>
                Mismatch
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Performer Display */}
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-1 leading-snug">
            <Link to={`/video/${video.id}`} className="hover:underline hover:text-amber-300">
              {video.performerDisplay || 'Unknown Performers'}
            </Link>
          </h3>

          {/* Title */}
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {video.title || video.filename}
          </p>

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {tagList.slice(0, 3).map((tag, idx) => (
                <TagChip key={idx} tag={tag} size="xs" />
              ))}
              {tagList.length > 3 && (
                <span className="text-[10px] text-zinc-500 self-center font-mono">
                  +{tagList.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Meta Footer */}
        <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs">
          {/* Rating or Watch info */}
          <div className="flex items-center gap-2 text-zinc-400 font-mono">
            {video.personalRating ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                <Star size={11} className="fill-amber-400" />
                {video.personalRating}
              </span>
            ) : (
              <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Unrated</span>
            )}

            <span className="text-zinc-700">•</span>

            {timesWatched > 0 ? (
              <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                <Eye size={11} className="text-zinc-500" />
                {timesWatched}x
                {lastWatchedDaysAgo !== null && (
                  <span className="text-zinc-500">({lastWatchedDaysAgo}d)</span>
                )}
              </span>
            ) : (
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Fresh</span>
            )}
          </div>

          {/* Interactive Actions */}
          <div className="flex items-center gap-1.5">
            <PlayButton video={video} size="xs" variant="primary" />

            {onToggleWatchlist && (
              <button
                type="button"
                onClick={() => onToggleWatchlist(video.id)}
                title={inWatchlist ? 'In Queue' : 'Add to Queue'}
                className={`p-1.5 rounded-md border transition-colors ${
                  inWatchlist
                    ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                    : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:bg-zinc-800/60'
                }`}
              >
                {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              </button>
            )}

            <Link
              to={`/sessions/new?videoId=${video.id}`}
              title="Log Rotation Session"
              className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
            >
              <Flame size={14} />
            </Link>

            <Link
              to={`/video/${video.id}`}
              className="text-[11px] font-mono font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
