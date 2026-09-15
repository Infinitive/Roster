import React from 'react';

interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function PageHeader({
  title,
  badge,
  subtitle,
  actions,
  icon
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          {icon && <span className="text-zinc-400">{icon}</span>}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-400 tracking-wide font-normal">{subtitle}</p>
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
