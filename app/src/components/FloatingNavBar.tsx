import React from 'react';
import { TabType } from '../types';
import { MaterialIcon } from './MaterialIcon';

interface FloatingNavBarProps {
  selectedTab: TabType;
  onTabSelected: (tab: TabType) => void;
}

export const FloatingNavBar: React.FC<FloatingNavBarProps> = ({
  selectedTab,
  onTabSelected,
}) => {
  const tabs: Array<{ id: TabType; title: string }> = [
    { id: 'tracks', title: 'Треки' },
    { id: 'drafts', title: 'Наброски' },
    { id: 'search', title: 'Поиск' },
  ];

  return (
    <div
      className="w-[264px] h-[66px] rounded-full bg-m3-surface-container-high shadow-2xl flex items-center justify-evenly px-1.5 py-0.5 select-none z-30"
      style={{
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.65)',
      }}
    >
      {tabs.map((tab) => {
        const isSelected = selectedTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabSelected(tab.id)}
            className="flex-1 h-full flex flex-col items-center justify-center focus:outline-none transition-transform active:scale-95"
          >
            {/* Animated Pill Container */}
            <div
              className={`h-[28px] rounded-[14px] flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isSelected
                  ? 'w-[56px] bg-m3-primary-container text-m3-on-primary-container'
                  : 'w-[38px] bg-transparent text-m3-on-surface-variant'
              }`}
            >
              <div
                className={`transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isSelected ? 'scale-105' : 'scale-95'
                }`}
              >
                {tab.id === 'tracks' && (
                  <MaterialIcon name="music_note" filled={isSelected} size={22} />
                )}

                {tab.id === 'drafts' && (
                  <MaterialIcon name="edit" filled={isSelected} size={20} />
                )}

                {tab.id === 'search' && (
                  <MaterialIcon name="search" filled={isSelected} size={22} weight={isSelected ? 600 : 400} />
                )}
              </div>
            </div>

            {/* Label */}
            <span
              className={`mt-0.5 text-[11px] font-nunito tracking-tight transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isSelected
                  ? 'font-bold text-m3-on-primary-container'
                  : 'font-medium text-m3-on-surface-variant'
              }`}
            >
              {tab.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};
