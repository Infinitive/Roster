import React from 'react';
import T9Mark from './T9Mark';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  showBrandMark?: boolean;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  showBrandMark = false,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`relative overflow-hidden flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-dashed border-zinc-800/80 bg-gradient-to-b from-[#111420]/60 to-[#0c0e14]/80 ${className}`}
    >
      {showBrandMark ? (
        <div className="mb-4">
          <T9Mark size={40} variant="signature" />
        </div>
      ) : icon ? (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-amber-400 mb-4 shadow-inner">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base sm:text-lg font-bold text-zinc-100 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
