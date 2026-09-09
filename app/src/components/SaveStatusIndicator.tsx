import React from 'react';
import { SaveState } from '../types';

interface SaveStatusIndicatorProps {
  state: SaveState;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ state }) => {
  return (
    <div className="w-8 h-8 flex items-center justify-center text-m3-on-surface-variant select-none">
      {state === 'saving' ? (
        <svg
          className="animate-spin w-[18px] h-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg
          className="w-[22px] h-[22px] text-m3-on-surface-variant transition-opacity duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      )}
    </div>
  );
};
