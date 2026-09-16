import React from 'react';

interface RosterBrandProps {
  variant?: 'logo' | 'wordmark' | 'combo';
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  priority?: boolean;
}

export default function RosterBrand({
  variant = 'logo',
  size = 'md',
  className = '',
  alt = 'ROSTER'
}: RosterBrandProps) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  
  const logoSrc = `${cleanBase}brand/roster-logo.png`;
  const wordmarkSrc = `${cleanBase}brand/roster-wordmark.png`;

  if (variant === 'wordmark') {
    const heightClass = typeof size === 'number' 
      ? '' 
      : size === 'sm' ? 'h-5' 
      : size === 'md' ? 'h-7' 
      : size === 'lg' ? 'h-9' 
      : 'h-12';

    return (
      <img
        src={wordmarkSrc}
        alt={alt}
        style={typeof size === 'number' ? { height: `${size}px` } : undefined}
        className={`w-auto object-contain select-none ${heightClass} ${className}`}
        loading="eager"
      />
    );
  }

  if (variant === 'combo') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <img
          src={logoSrc}
          alt=""
          className="h-7 w-auto object-contain"
          loading="eager"
        />
        <img
          src={wordmarkSrc}
          alt={alt}
          className="h-6 w-auto object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // Default 'logo'
  const sizeClass = typeof size === 'number'
    ? ''
    : size === 'sm' ? 'h-6 w-6'
    : size === 'md' ? 'h-8 w-8'
    : size === 'lg' ? 'h-10 w-10'
    : 'h-14 w-14';

  return (
    <img
      src={logoSrc}
      alt={alt}
      style={typeof size === 'number' ? { height: `${size}px`, width: `${size}px` } : undefined}
      className={`object-contain select-none ${sizeClass} ${className}`}
      loading="eager"
    />
  );
}
