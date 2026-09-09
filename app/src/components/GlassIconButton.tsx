import React from 'react';

interface GlassIconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  sizeClass?: string;
  bgClass?: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  onClick,
  icon,
  ariaLabel,
  className = '',
  sizeClass = 'w-11 h-11',
  bgClass = 'bg-m3-surface-container-high',
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${sizeClass} ${bgClass} rounded-full flex items-center justify-center text-m3-on-surface hover:brightness-110 active:scale-95 transition-all focus:outline-none flex-shrink-0 select-none ${className}`}
    >
      {icon}
    </button>
  );
};
