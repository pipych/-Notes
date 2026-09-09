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
import { MaterialIcon } from '../components/MaterialIcon';

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
    <div className="relative w-full h-[100dvh] bg-m3-bg flex flex-col overflow-hidden select-none">
      {/* Pinned Top Bar (safe below Telegram header and notch) */}
      <div
        className="w-full flex items-center justify-between px-4 pb-2 z-30 flex-shrink-0 bg-m3-bg/85 backdrop-blur-md"
        style={{ paddingTop: 'calc(var(--mobile-top-padding, 94px) + 10px)' }}
      >
        {currentTab === 'search' ? (
          <div className="flex-1 mr-3">
            <GlassSearchBar
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              placeholderText="Поиск по трекам и наброскам..."
            />
          </div>
        ) : (
          <div className="flex-1">
            <span className="font-nunito font-extrabold text-[26px] text-m3-on-background tracking-tight">
              {currentTab === 'tracks' ? 'Треки' : 'Наброски'}
            </span>
          </div>
        )}

        <GlassIconButton
          onClick={onOpenProfile}
          ariaLabel="Профиль"
          icon={<MaterialIcon name="person" size={22} />}
        />
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 w-full flex flex-col overflow-y-auto px-4 pt-2"
        style={{ paddingBottom: 'calc(var(--mobile-bottom-inset, 32px) + 160px)' }}
      >
        {/* Pinned Incoming Invitations Banner */}
        {hasPendingInvites && (
          <div className="mb-3">
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
                <MaterialIcon name="music_note" size={60} className="text-m3-outline mb-4" />
                <div className="text-m3-on-surface-variant font-nunito font-semibold text-[17px] mb-2">
                  Треков пока нет
                </div>
                <div className="flex items-center gap-1.5 text-m3-outline text-[14px] font-nunito">
                  <span>Нажми на</span>
                  <div className="w-6 h-6 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface">
                    <MaterialIcon name="add" size={16} />
                  </div>
                  <span>чтобы написать трек</span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
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
                <MaterialIcon name="edit" size={60} className="text-m3-outline mb-4" />
                <div className="text-m3-on-surface-variant font-nunito font-semibold text-[17px] mb-2">
                  Набросков пока нет
                </div>
                <div className="flex items-center gap-1.5 text-m3-outline text-[14px] font-nunito">
                  <span>Нажми на</span>
                  <div className="w-6 h-6 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface">
                    <MaterialIcon name="add" size={16} />
                  </div>
                  <span>чтобы создать набросок</span>
                </div>
              </div>
            ) : (
              <div className="pt-1">
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
                <MaterialIcon name="search" size={56} className="text-m3-on-surface-variant/40 mb-3" />
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
      <div className="pointer-events-none fixed bottom-0 inset-x-0 h-[190px] z-30 flex justify-center">
        <div
          className="w-full max-w-md h-full"
          style={{
            background: 'linear-gradient(to top, #131314 0%, rgba(19, 19, 20, 0.94) 40%, rgba(19, 19, 20, 0.45) 75%, transparent 100%)',
          }}
        />
      </div>

      {/* Floating Bottom Nav Bar & Pulsing FAB (always pinned on top of everything) */}
      <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex justify-center">
        <div className="w-full max-w-md relative h-0">
          {/* Pulsing FAB (only on Tracks and Drafts) */}
          {currentTab !== 'search' && (
            <div
              className="pointer-events-auto absolute right-5 transition-transform active:scale-95"
              style={{
                bottom: 'calc(var(--mobile-bottom-inset, 32px) + 78px)',
              }}
            >
              <PulsingFab
                onClick={() => onNewNote(currentTab === 'drafts')}
                isPulsing={totalCountInTab === 0}
              />
            </div>
          )}

          {/* Floating Bottom Nav Bar */}
          <div
            className="pointer-events-auto absolute inset-x-0 flex justify-center"
            style={{
              bottom: 'var(--mobile-bottom-inset, 32px)',
            }}
          >
            <FloatingNavBar
              selectedTab={currentTab}
              onTabSelected={onTabChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
