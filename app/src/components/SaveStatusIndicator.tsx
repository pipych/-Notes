import React from 'react';
import { SaveState } from '../types';
import { MaterialIcon } from './MaterialIcon';

interface SaveStatusIndicatorProps {
  state: SaveState;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ state }) => {
  return (
    <div className="w-8 h-8 flex items-center justify-center text-m3-on-surface-variant select-none">
      {state === 'saving' ? (
        <MaterialIcon name="sync" size={20} className="animate-spin text-m3-primary" />
      ) : (
        <MaterialIcon name="cloud_done" size={22} className="text-m3-on-surface-variant transition-opacity duration-200" />
      )}
    </div>
  );
};
