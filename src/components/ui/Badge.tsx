import React from 'react';

export type BadgeVariant = 
  | 'default' 
  | 'folder' 
  | 'resolution' 
  | 'rating' 
  | 'real' 
  | 'seed' 
  | 'research' 
  | 'mismatch' 
  | 'vibe' 
  | 'active'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50',
  folder: 'bg-slate-800/80 text-slate-200 border-slate-700/60 font-medium',
  resolution: 'bg-zinc-900/90 text-emerald-400 border-emerald-900/40 font-mono font-medium',
  rating: 'bg-amber-950/40 text-amber-300 border-amber-800/50 font-medium',
  real: 'bg-blue-950/60 text-blue-300 border-blue-800/50 font-medium',
  seed: 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40',
  research: 'bg-amber-950/70 text-amber-300 border-amber-800/60 font-medium',
  mismatch: 'bg-rose-950/70 text-rose-300 border-rose-800/60 font-medium',
  vibe: 'bg-purple-950/50 text-purple-300 border-purple-800/40',
  active: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50 font-medium',
  outline: 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
};

const sizeStyles = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded tracking-wide',
  sm: 'text-xs px-2 py-0.5 rounded-md tracking-normal',
  md: 'text-xs px-2.5 py-1 rounded-md tracking-normal'
};

export default function Badge({
  children,
  variant = 'default',
  size = 'xs',
  className = '',
  icon
}: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
