import React, { useState, useRef } from 'react';
import { Note } from '../types';
import { formatDisplayDate } from '../utils/dateGrouping';

interface NoteItemViewProps {
  note: Note;
  shapeClass: string;
  onClick: () => void;
  onDelete: () => void;
}

export const NoteItemView: React.FC<NoteItemViewProps> = ({
  note,
  shapeClass,
  onClick,
  onDelete,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(false);
  const isTouchStartedRef = useRef(false);

  const isTrack = Boolean(note.title && note.title.trim().length > 0);
  const displayTitle = isTrack
    ? note.title
    : (note.content?.split(/\r?\n/)[0]?.trim() || 'Пустой набросок');

  const displayPreview = isTrack
    ? (note.content?.split(/\r?\n/)[0]?.trim() || '')
    : '';

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isTouchStartedRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isHorizontalSwipeRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isTouchStartedRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    if (!isHorizontalSwipeRef.current && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
      isHorizontalSwipeRef.current = true;
    }

    if (isHorizontalSwipeRef.current) {
      if (diffX < 0) {
        // Swiping left to delete
        const raw = Math.abs(diffX);
        const damped = raw > 80 ? 80 + (raw - 80) * 0.4 : raw;
        setTranslateX(-damped);
      } else {
        // Subtle resistance right
        setTranslateX(diffX * 0.15);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isTouchStartedRef.current) return;
    isTouchStartedRef.current = false;
    setIsDragging(false);

    if (translateX < -75) {
      // Confirmed dismiss
      setIsDeleting(true);
      setTranslateX(-400);
      setTimeout(() => {
        onDelete();
      }, 320);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isHorizontalSwipeRef.current || Math.abs(translateX) > 5) {
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <div
      className={`relative overflow-hidden mb-[3px] select-none transition-all duration-300 ${shapeClass} ${
        isDeleting ? 'max-h-0 opacity-0 my-0 mb-0' : 'max-h-36 opacity-100'
      }`}
    >
      {/* Red Delete Background */}
      <div
        className="absolute inset-0 bg-m3-error-container flex items-center justify-end px-6 z-0"
        style={{
          opacity: Math.min(1, Math.abs(translateX) / 60),
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F9DEDC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>

      {/* Main Card Surface */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        className={`relative z-10 w-full bg-m3-surface-container px-4 py-[13px] cursor-pointer active:bg-m3-surface-container-high ${shapeClass}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.25)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 flex-1 pr-3 min-w-0">
            {note.is_shared && (
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A8C7FA"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
            <span className="font-nunito font-bold text-m3-on-surface text-[17px] leading-[22px] truncate">
              {displayTitle}
            </span>
          </div>

          <span className="font-nunito text-m3-on-surface-variant text-[12px] leading-[18px] flex-shrink-0">
            {formatDisplayDate(note.updated_at || note.created_at)}
          </span>
        </div>

        {note.is_shared && note.owner_name && (
          <div className="mt-0.5 text-m3-primary/85 font-nunito text-[11px] leading-[16px] truncate">
            Автор: {note.owner_name}
          </div>
        )}

        {displayPreview && (
          <div className="mt-1 text-m3-on-surface-variant font-nunito text-[13px] leading-[18px] truncate">
            {displayPreview}
          </div>
        )}
      </div>
    </div>
  );
};
