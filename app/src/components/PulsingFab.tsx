import React from 'react';
import { MaterialIcon } from './MaterialIcon';

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
        <MaterialIcon name="add" size={30} weight={600} />
      </button>
    </div>
  );
};
