import React from 'react';
import { CANONICAL_30_TAGS } from '../../data/canonicalTags';

interface TagChipProps {
  key?: React.Key;
  tag: string;
  size?: 'xs' | 'sm';
  onClick?: () => void;
  selected?: boolean;
}

export default function TagChip({ tag, size = 'xs', onClick, selected = false }: TagChipProps) {
  const canonicalDef = CANONICAL_30_TAGS.find(
    c => c.name.toLowerCase() === tag.trim().toLowerCase()
  );
  const isCanonical = !!canonicalDef;

  // Category tints
  let catStyle = 'bg-zinc-900/90 text-zinc-400 border-zinc-800/80';
  if (isCanonical) {
    switch (canonicalDef.category) {
      case 'Archetype & Identity':
        catStyle = 'bg-cyan-950/40 text-cyan-300 border-cyan-900/40 hover:border-cyan-700/50';
        break;
      case 'Sexual Dynamic & Vibe':
        catStyle = 'bg-rose-950/40 text-rose-300 border-rose-900/40 hover:border-rose-700/50';
        break;
      case 'Acts & Mechanics':
        catStyle = 'bg-amber-950/40 text-amber-300 border-amber-900/40 hover:border-amber-700/50';
        break;
      case 'Context & Setting':
        catStyle = 'bg-purple-950/40 text-purple-300 border-purple-900/40 hover:border-purple-700/50';
        break;
    }
  }

  const selectedStyle = selected 
    ? 'ring-1 ring-white text-white font-medium shadow-sm' 
    : '';

  const sizeClass = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5 rounded' 
    : 'text-xs px-2.5 py-1 rounded-md';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1 border transition-all ${sizeClass} ${catStyle} ${selectedStyle} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span>{canonicalDef ? canonicalDef.name : tag}</span>
      {isCanonical && (
        <span className="w-1 h-1 rounded-full bg-current opacity-60 ml-0.5" />
      )}
    </button>
  );
}
