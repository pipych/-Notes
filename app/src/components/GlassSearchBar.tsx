import React, { useRef } from 'react';

interface GlassSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholderText: string;
  className?: string;
}

export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({
  query,
  onQueryChange,
  placeholderText,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`h-[52px] rounded-full bg-m3-surface-container-high px-4 flex items-center gap-3 cursor-text ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C4C7C5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholderText}
        className="flex-1 bg-transparent border-none text-m3-on-surface text-[16px] font-nunito placeholder:text-m3-on-surface-variant focus:outline-none"
      />

      {query.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQueryChange('');
            inputRef.current?.focus();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-m3-on-surface-variant hover:text-m3-on-surface focus:outline-none"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
