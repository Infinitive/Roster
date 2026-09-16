import React from 'react';

interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  sectionNumber?: string;
}

export default function PageHeader({
  title,
  badge,
  subtitle,
  actions,
  icon,
  sectionNumber
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-800/90">
      <div className="space-y-1">
        {sectionNumber && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-amber-400 block">
            // {sectionNumber}
          </span>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {icon && <span className="text-zinc-400 flex-none">{icon}</span>}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white editorial-header">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-400 tracking-wide font-normal max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap flex-none">
          {actions}
        </div>
      )}
    </div>
  );
}
