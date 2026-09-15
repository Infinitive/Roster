import React from 'react';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md'
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-xl overflow-x-auto max-w-full no-scrollbar ${className}`}
    >
      {options.map(opt => {
        const active = opt.id === value;
        const paddingClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm';

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all ${paddingClass} ${
              active
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
