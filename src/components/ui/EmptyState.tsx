import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
