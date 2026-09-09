import React from 'react';

interface PulsingFabProps {
  onClick: () => void;
  isPulsing: boolean;
}

export const PulsingFab: React.FC<PulsingFabProps> = ({ onClick, isPulsing }) => {
  return (
    <div className="w-16 h-16 flex items-center justify-center select-none z-30">
      <button
        onClick={onClick}
        className={`w-14 h-14 rounded-[20px] bg-m3-primary text-m3-on-primary flex items-center justify-center shadow-lg transition-transform active:scale-90 focus:outline-none ${
          isPulsing ? 'animate-fab-pulse' : ''
        }`}
        style={{
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45)',
        }}
        aria-label="New Track"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};
