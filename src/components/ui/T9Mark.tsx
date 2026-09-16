import React from 'react';
import RosterBrand from './RosterBrand';

interface T9MarkProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  variant?: 'signature' | 'monochrome' | 'subtle';
}

export default function T9Mark({
  size = 28,
  className = '',
  showWordmark = false
}: T9MarkProps) {
  if (showWordmark) {
    return <RosterBrand variant="combo" className={className} />;
  }

  return (
    <RosterBrand
      variant="logo"
      size={size}
      className={className}
      alt="ROSTER"
    />
  );
}

