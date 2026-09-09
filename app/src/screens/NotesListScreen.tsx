import React from 'react';
import { Note, TabType, NoteInvitation } from '../types';
import { groupNotesByDate } from '../utils/dateGrouping';
import { getGroupItemShapeStyle } from '../theme/shapes';
import { NoteItemView } from '../components/NoteItemView';
import { FloatingNavBar } from '../components/FloatingNavBar';
import { PulsingFab } from '../components/PulsingFab';
import { InvitationsBanner } from '../components/InvitationsBanner';
import { GlassSearchBar } from '../components/GlassSearchBar';
import { GlassIconButton } from '../components/GlassIconButton';

interface NotesListScreenProps {
  notes: Note[];
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenNote: (id: string) => void;
  onNewNote: (isDraft: boolean) => void;
  onDeleteNote: (id: string) => void;
  onOpenProfile: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  pendingInvitations: NoteInvitation[];
  onAcceptInvitation: (id: string) => void;
  onDeclineInvitation: (id: string) => void;
}

export const NotesListScreen: React.FC<NotesListScreenProps> = ({
  notes,
  currentTab,
  onTabChange,
  onOpenNote,
  onNewNote,
  onDeleteNote,
  onOpenProfile,
  searchQuery,
  onSearchQueryChange,
  pendingInvitations,
  onAcceptInvitation,
  onDeclineInvitation,
}) => {
  // Filter notes according to current tab
  const tracks = notes.filter((n) => n.title && n.title.trim().length > 0);
  const drafts = notes.filter((n) => !n.title || n.title.trim().length === 0);

  const searchFilteredNotes = notes.filter((n) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    const titleMatch = (n.title || '').toLowerCase().includes(q);
    const contentMatch = (n.content || '').toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  const activeNotes =
    currentTab === 'tracks' ? tracks : currentTab === 'drafts' ? drafts : searchFilteredNotes;

  const grouped = groupNotesByDate(activeNotes);
  const totalCountInTab = currentTab === 'tracks' ? tracks.length : drafts.length;

  const hasPendingInvites = pendingInvitations.length > 0 && currentTab !== 'search';

  return (
    <div className="relative w-full h-full min-h-screen bg-m3-bg flex flex-col overflow-hidden select-none">
      {/* Top Fading Scrim Gradient */}
      {currentTab !== 'search' && (
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-[90px] z-10"
          style={{
            background: 'linear-gradient(to bottom, #131314 0%, rgba(19, 19, 20, 0.85) 45%, rgba(19, 19, 20, 0.35) 75%, transparent 100%)',
          }}
        />
      )}

      {/* Floating Profile Button (pinned top-right) */}
      <div className="absolute top-3 right-4 z-20">
        <GlassIconButton
          onClick={onOpenProfile}
          ariaLabel="Профиль"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col overflow-y-auto px-4 pt-3 pb-32">
        {/* Search Tab Top Input */}
        {currentTab === 'search' && (
          <div className="w-full pr-14 mb-3 z-10">
            <GlassSearchBar
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              placeholderText="Поиск по трекам и наброскам..."
            />
          </div>
        )}

        {/* Pinned Incoming Invitations Banner */}
        {hasPendingInvites && (
          <div className="mb-4 pt-12">
            <InvitationsBanner
              invitations={pendingInvitations}
              onAccept={onAcceptInvitation}
              onDecline={onDeclineInvitation}
            />
          </div>
        )}

        {/* Content View per Tab */}
        {currentTab === 'tracks' && (
          <>
            {tracks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center">
                <svg
                  className="w-16 h-16 text-m3-outline mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <div className="text-m3-on-surface-variant font-nunito font-semibold text-[17px] mb-2">
                  Треков пока нет
                </div>
                <div className="flex items-center gap-1.5 text-m3-outline text-[14px] font-nunito">
                  <span>Нажми на</span>
                  <div className="w-6 h-6 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span>чтобы написать трек</span>
                </div>
              </div>
            ) : (
              <div className={hasPendingInvites ? '' : 'pt-10'}>
                {grouped.map((group, groupIdx) => (
                  <div key={group.category.name} className="mb-2">
                    <div
                      className={`text-m3-on-surface font-nunito font-bold text-[18px] pl-1 pb-1.5 ${
                        groupIdx > 0 ? 'pt-4' : 'pt-1'
                      }`}
                    >
                      {group.category.title}
                    </div>

                    {group.notes.map((note, idx) => (
                      <NoteItemView
                        key={note.id}
                        note={note}
                        shapeClass={getGroupItemShapeStyle(idx, group.notes.length)}
                        onClick={() => onOpenNote(note.id)}
                        onDelete={() => onDeleteNote(note.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentTab === 'drafts' && (
          <>
            {drafts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center pt-24 text-center">
                <svg
                  className="w-16 h-16 text-m3-outline mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M6 6h10" />
                  <path d="M6 10h10" />
                </svg>
                <div className="text-m3-on-surface-variant font-nunito font-semibold text-[17px] mb-2">
                  Набросков пока нет
                </div>
                <div className="flex items-center gap-1.5 text-m3-outline text-[14px] font-nunito">
                  <span>Нажми на</span>
                  <div className="w-6 h-6 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span>чтобы создать набросок</span>
                </div>
              </div>
            ) : (
              <div className={hasPendingInvites ? '' : 'pt-10'}>
                {grouped.map((group, groupIdx) => (
                  <div key={group.category.name} className="mb-2">
                    <div
                      className={`text-m3-on-surface font-nunito font-bold text-[18px] pl-1 pb-1.5 ${
                        groupIdx > 0 ? 'pt-4' : 'pt-1'
                      }`}
                    >
                      {group.category.title}
                    </div>

                    {group.notes.map((note, idx) => (
                      <NoteItemView
                        key={note.id}
                        note={note}
                        shapeClass={getGroupItemShapeStyle(idx, group.notes.length)}
                        onClick={() => onOpenNote(note.id)}
                        onDelete={() => onDeleteNote(note.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentTab === 'search' && (
          <div className="flex-1 flex flex-col">
            {searchQuery.trim().length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center pt-20 text-center">
                <svg
                  className="w-14 h-14 text-m3-on-surface-variant/40 mb-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <div className="text-m3-on-surface font-nunito font-semibold text-[17px] mb-1">
                  Поиск по трекам и наброскам
                </div>
                <div className="text-m3-on-surface-variant font-nunito text-[14px]">
                  Введи слово, название или строку из текста
                </div>
              </div>
            ) : searchFilteredNotes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center pt-20 text-center">
                <div className="text-m3-on-surface font-nunito font-semibold text-[17px] mb-1">
                  Ничего не найдено
                </div>
                <div className="text-m3-on-surface-variant font-nunito text-[14px]">
                  По запросу «{searchQuery}» совпадений нет
                </div>
              </div>
            ) : (
              <div>
                {grouped.map((group, groupIdx) => (
                  <div key={group.category.name} className="mb-2">
                    <div
                      className={`text-m3-on-surface font-nunito font-bold text-[18px] pl-1 pb-1.5 ${
                        groupIdx > 0 ? 'pt-4' : 'pt-1'
                      }`}
                    >
                      {group.category.title}
                    </div>

                    {group.notes.map((note, idx) => (
                      <NoteItemView
                        key={note.id}
                        note={note}
                        shapeClass={getGroupItemShapeStyle(idx, group.notes.length)}
                        onClick={() => onOpenNote(note.id)}
                        onDelete={() => onDeleteNote(note.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Fading Scrim Gradient */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[130px] z-10"
        style={{
          background: 'linear-gradient(to top, #131314 0%, rgba(19, 19, 20, 0.9) 40%, rgba(19, 19, 20, 0.45) 75%, transparent 100%)',
        }}
      />

      {/* Pulsing FAB (only on Tracks and Drafts) */}
      {currentTab !== 'search' && (
        <div className="absolute bottom-[86px] right-5 z-20">
          <PulsingFab
            onClick={() => onNewNote(currentTab === 'drafts')}
            isPulsing={totalCountInTab === 0}
          />
        </div>
      )}

      {/* Floating Bottom Nav Bar */}
      <div className="absolute bottom-2.5 inset-x-0 flex justify-center z-20">
        <FloatingNavBar
          selectedTab={currentTab}
          onTabSelected={onTabChange}
        />
      </div>
    </div>
  );
};
