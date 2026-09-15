import React from 'react';

interface T9MarkProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  variant?: 'signature' | 'monochrome' | 'subtle';
}

export default function T9Mark({
  size = 28,
  className = '',
  showWordmark = false,
  variant = 'signature'
}: T9MarkProps) {
  const isSignature = variant === 'signature';
  const isSubtle = variant === 'subtle';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-none transition-transform hover:scale-105 active:scale-95 duration-200"
      >
        <defs>
          <linearGradient id="t9Amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="t9Graphite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e222d" />
            <stop offset="100%" stopColor="#0c0e12" />
          </linearGradient>
        </defs>

        {/* Squircle backplate */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill="url(#t9Graphite)"
          stroke={isSignature ? '#f59e0b' : '#27272a'}
          strokeWidth="2.5"
          strokeOpacity={isSignature ? '0.4' : '0.8'}
        />
        
        {/* Subtle inner hairline */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="20"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          strokeOpacity="0.06"
        />

        {/* The "T" in titanium white */}
        <path
          d="M 22 30 L 48 30 C 49.5 30 51 31.5 51 33 L 51 39 C 51 40.5 49.5 42 48 42 L 39 42 L 39 70 C 39 71.5 37.5 73 36 73 L 30 73 C 28.5 73 27 71.5 27 70 L 27 42 L 22 42 C 20.5 42 19 40.5 19 39 L 19 33 C 19 31.5 20.5 30 22 30 Z"
          fill={isSubtle ? '#a1a1aa' : '#f4f4f5'}
        />

        {/* The "9" with signature warm amber gradient */}
        <path
          d="M 54 30 L 76 30 C 79 30 81 32 81 35 L 81 52 C 81 55 79 57 76 57 L 65 57 L 65 67 C 65 69 63.5 70 61.5 70 L 55.5 70 C 53.5 70 52 69 52 67 L 52 46 C 52 43 54 41 57 41 L 70 41 L 70 39 L 54 39 C 52.5 39 51.5 38 51.5 36.5 L 51.5 32.5 C 51.5 31 52.5 30 54 30 Z"
          fill={isSignature ? 'url(#t9Amber)' : isSubtle ? '#a1a1aa' : '#f4f4f5'}
        />

        {/* 9 loop negative cutout */}
        <rect
          x="62"
          y="47"
          width="8"
          height="3"
          rx="1"
          fill="#0c0e12"
          opacity="0.95"
        />

        {/* Signature amber accent pip */}
        <rect
          x="73"
          y="65.5"
          width="6"
          height="6"
          rx="1.5"
          fill={isSignature ? '#f59e0b' : '#71717a'}
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-tight text-white font-mono text-sm">
            T9
          </span>
          <span className="text-[10px] tracking-wider uppercase font-mono text-zinc-400 font-semibold">
            Registry
          </span>
        </div>
      )}
    </div>
  );
}
