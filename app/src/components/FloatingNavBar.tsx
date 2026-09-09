import React from 'react';
import { TabType } from '../types';

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
                  isSelected ? (
                    // Music Note Filled
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  ) : (
                    // Music Note Outlined
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  )
                )}

                {tab.id === 'drafts' && (
                  isSelected ? (
                    // Edit Filled
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  ) : (
                    // Edit Outlined
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  )
                )}

                {tab.id === 'search' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isSelected ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
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
