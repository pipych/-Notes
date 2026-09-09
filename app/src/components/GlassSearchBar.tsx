import React, { useRef } from 'react';
import { MaterialIcon } from './MaterialIcon';

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
      <MaterialIcon name="search" size={22} className="text-m3-on-surface-variant flex-shrink-0" />

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
          <MaterialIcon name="close" size={20} />
        </button>
      )}
    </div>
  );
};
