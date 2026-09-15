import React, { useState } from 'react';
import { Video } from '../../types';
import { usePlayback } from '../../context/PlaybackContext';
import { Play, Check, Loader2 } from 'lucide-react';

interface PlayButtonProps {
  video: Video;
  variant?: 'primary' | 'secondary' | 'compact' | 'icon' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function PlayButton({
  video,
  variant = 'primary',
  size = 'md',
  label,
  className = ''
}: PlayButtonProps) {
  const { playVideo, settings } = usePlayback();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      await playVideo(video);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const isIcon = variant === 'icon';

  // Sizing definitions
  const sizeClasses = {
    xs: isIcon ? 'p-1' : 'px-2 py-1 text-[11px] gap-1',
    sm: isIcon ? 'p-1.5' : 'px-2.5 py-1 text-xs gap-1.5',
    md: isIcon ? 'p-2' : 'px-3.5 py-1.5 text-xs gap-2',
    lg: isIcon ? 'p-3' : 'px-5 py-2.5 text-sm gap-2.5',
  }[size];

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
  }[size];

  // Variant definitions
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-950/40 border border-amber-400/40';
      break;
    case 'secondary':
      variantClasses = 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold border border-zinc-700 hover:border-amber-500/50';
      break;
    case 'compact':
      variantClasses = 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-semibold border border-amber-500/30';
      break;
    case 'icon':
      variantClasses = 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-md shadow-amber-950/30 rounded-xl active:scale-90';
      break;
    case 'subtle':
      variantClasses = 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800';
      break;
  }

  const defaultLabel = isIcon ? '' : (label || 'Play');

  return (
    <button
      type="button"
      onClick={handleClick}
      title={settings.enabled ? `Play in ${settings.playbackAppName || 'VLC'}` : 'Play with T9 Shortcut'}
      disabled={loading}
      className={`inline-flex items-center justify-center font-mono rounded-xl transition-all duration-150 active:scale-95 select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {loading ? (
        <Loader2 size={iconSizes} className="animate-spin text-inherit" />
      ) : (
        <Play size={iconSizes} className="fill-current translate-x-0.25" />
      )}
      {defaultLabel && <span className="tracking-wide font-sans">{defaultLabel}</span>}
    </button>
  );
}
