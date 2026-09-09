import React, { useState, useRef, useEffect } from 'react';
import { Note, UserProfile, NoteCollaborator, NoteInvitation, RhymeMessage, SaveState } from '../types';
import { groupNotesByDate, formatDisplayDate } from '../utils/dateGrouping';
import { GlassSearchBar } from '../components/GlassSearchBar';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import { GlassIconButton } from '../components/GlassIconButton';
import { AiRhymesPanel } from './AiRhymesPanel';
import { CollaboratorsSheet } from './CollaboratorsSheet';
import { ProfileScreen } from './ProfileScreen';
import { MaterialIcon } from '../components/MaterialIcon';

interface DesktopWorkspaceProps {
  notes: Note[];
  currentUser: UserProfile;
  currentNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onNewNote: (isDraft?: boolean) => void;
  onSaveNote: (title: string, content: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  saveState: SaveState;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  // Collaboration
  pendingInvitations: NoteInvitation[];
  onAcceptInvitation: (id: string) => void;
  onDeclineInvitation: (id: string) => void;
  collaborators: NoteCollaborator[];
  sentInvitations: NoteInvitation[];
  availableUsers: UserProfile[];
  isCollabLoading: boolean;
  onInviteUser: (user: UserProfile) => void;
  onCancelInvite: (inviteId: string) => void;
  onRemoveCollaborator: (userId: string) => void;
  onRefreshCollab: () => void;
  // AI
  chatHistory: RhymeMessage[];
  isAiLoading: boolean;
  onSendAiQuery: (query: string) => void;
  // Auth
  onLogout: () => void;
  onLinkGoogle: () => void;
}

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  notes,
  currentUser,
  currentNoteId,
  onSelectNote,
  onNewNote,
  onSaveNote,
  onDeleteNote,
  saveState,
  searchQuery,
  onSearchQueryChange,
  pendingInvitations,
  onAcceptInvitation,
  onDeclineInvitation,
  collaborators,
  sentInvitations,
  availableUsers,
  isCollabLoading,
  onInviteUser,
  onCancelInvite,
  onRemoveCollaborator,
  onRefreshCollab,
  chatHistory,
  isAiLoading,
  onSendAiQuery,
  onLogout,
  onLinkGoogle,
}) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'tracks' | 'drafts'>('tracks');
  const [isAiPaneOpen, setIsAiPaneOpen] = useState(true);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editor states
  const activeNote = notes.find((n) => n.id === currentNoteId) || null;
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const isTypingRef = useRef(false);
  const autoSaveTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
  }, [title, content]);

  useEffect(() => {
    if (activeNote && !isTypingRef.current) {
      setTitle(activeNote.title || '');
      setContent(activeNote.content || '');
    } else if (!activeNote) {
      setTitle('');
      setContent('');
    }
  }, [activeNote?.id, activeNote?.title, activeNote?.content]);

  const scheduleSave = (newTitle: string, newContent: string) => {
    isTypingRef.current = true;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      await onSaveNote(newTitle, newContent);
      isTypingRef.current = false;
    }, 600);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, contentRef.current);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(titleRef.current, val);
  };

  const handleRhymeSelected = (rhyme: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const updated = content ? `${content} ${rhyme}` : rhyme;
      setContent(updated);
      scheduleSave(titleRef.current, updated);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = contentRef.current;
    const before = current.substring(0, start);
    const after = current.substring(end);

    const needsSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
    const insertion = (needsSpaceBefore ? ' ' : '') + rhyme;
    const updated = before + insertion + after;

    setContent(updated);
    scheduleSave(titleRef.current, updated);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + insertion.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 50);
  };

  // Filter notes by search query and sidebar folder
  const filteredNotes = notes.filter((n) => {
    const isTrack = Boolean(n.title && n.title.trim().length > 0);
    if (selectedFolder === 'tracks' && !isTrack) return false;
    if (selectedFolder === 'drafts' && isTrack) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const titleMatch = (n.title || '').toLowerCase().includes(q);
    const contentMatch = (n.content || '').toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  const grouped = groupNotesByDate(filteredNotes);

  const tracksCount = notes.filter((n) => n.title && n.title.trim().length > 0).length;
  const draftsCount = notes.filter((n) => !n.title || n.title.trim().length === 0).length;

  const userInitial = (currentUser.first_name || currentUser.username || currentUser.google_email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="w-full h-screen bg-m3-bg text-m3-on-background font-nunito flex flex-row overflow-hidden select-none">
      {/* ─── 1. LEFT PANEL: NAVIGATION SIDEBAR (Collapsible) ─────────── */}
      <aside
        className={`h-full flex flex-col bg-m3-surface-container-low border-r border-m3-outline-variant/20 flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSidebarExpanded ? 'w-64' : 'w-[72px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-m3-outline-variant/15 flex-shrink-0">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-2.5">
              <span className="font-nunito font-extrabold text-[22px] text-m3-on-surface tracking-tight">
                Bars
              </span>
              <span className="text-[11px] font-nunito font-bold px-2 py-0.5 rounded-full bg-m3-primary-container text-m3-on-primary-container">
                Pro
              </span>
            </div>
          ) : null}

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-m3-on-surface-variant hover:bg-m3-surface-container hover:text-m3-on-surface active:scale-95 transition-all focus:outline-none"
            title={isSidebarExpanded ? 'Свернуть боковую панель' : 'Развернуть боковую панель'}
          >
            <MaterialIcon name={isSidebarExpanded ? 'menu_open' : 'menu'} size={22} />
          </button>
        </div>

        {/* New Note Button */}
        <div className="p-3 flex-shrink-0">
          {isSidebarExpanded ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNewNote(false)}
                className="flex-1 h-11 px-4 rounded-full bg-m3-primary text-[#041E49] font-nunito font-bold text-[14px] flex items-center justify-center gap-2 shadow hover:brightness-105 active:scale-95 transition-all focus:outline-none"
              >
                <MaterialIcon name="add" size={18} weight={600} />
                <span>Новый трек</span>
              </button>

              <button
                onClick={() => onNewNote(true)}
                title="Создать набросок"
                className="w-11 h-11 rounded-full bg-m3-surface-container-high text-m3-on-surface flex items-center justify-center hover:bg-m3-surface-container-highest active:scale-95 transition-all focus:outline-none flex-shrink-0"
              >
                <MaterialIcon name="edit" size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNewNote(false)}
              className="w-12 h-12 rounded-[18px] bg-m3-primary text-[#041E49] flex items-center justify-center mx-auto shadow hover:brightness-105 active:scale-95 transition-all focus:outline-none"
              title="Создать трек"
            >
              <MaterialIcon name="add" size={22} weight={600} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Items (Apple Notes Folders) */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1">
          {/* Tracks Folder */}
          <button
            onClick={() => setSelectedFolder('tracks')}
            className={`w-full h-11 rounded-full flex items-center px-3.5 transition-colors focus:outline-none ${
              selectedFolder === 'tracks'
                ? 'bg-m3-primary-container text-m3-on-primary-container font-bold'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container font-medium'
            } ${!isSidebarExpanded ? 'justify-center' : 'justify-between'}`}
            title="Треки"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="music_note" size={20} filled={selectedFolder === 'tracks'} />
              {isSidebarExpanded && <span>Треки</span>}
            </div>
            {isSidebarExpanded && (
              <span className="text-[12px] font-nunito px-2 py-0.5 rounded-full bg-m3-surface-container-high/60">
                {tracksCount}
              </span>
            )}
          </button>

          {/* Drafts Folder */}
          <button
            onClick={() => setSelectedFolder('drafts')}
            className={`w-full h-11 rounded-full flex items-center px-3.5 transition-colors focus:outline-none ${
              selectedFolder === 'drafts'
                ? 'bg-m3-primary-container text-m3-on-primary-container font-bold'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container font-medium'
            } ${!isSidebarExpanded ? 'justify-center' : 'justify-between'}`}
            title="Наброски"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="edit" size={20} filled={selectedFolder === 'drafts'} />
              {isSidebarExpanded && <span>Наброски</span>}
            </div>
            {isSidebarExpanded && (
              <span className="text-[12px] font-nunito px-2 py-0.5 rounded-full bg-m3-surface-container-high/60">
                {draftsCount}
              </span>
            )}
          </button>

          {/* All Notes Folder */}
          <button
            onClick={() => setSelectedFolder('all')}
            className={`w-full h-11 rounded-full flex items-center px-3.5 transition-colors focus:outline-none ${
              selectedFolder === 'all'
                ? 'bg-m3-primary-container text-m3-on-primary-container font-bold'
                : 'text-m3-on-surface-variant hover:bg-m3-surface-container font-medium'
            } ${!isSidebarExpanded ? 'justify-center' : 'justify-between'}`}
            title="Все заметки"
          >
            <div className="flex items-center gap-3">
              <MaterialIcon name="folder" size={20} filled={selectedFolder === 'all'} />
              {isSidebarExpanded && <span>Все заметки</span>}
            </div>
            {isSidebarExpanded && (
              <span className="text-[12px] font-nunito px-2 py-0.5 rounded-full bg-m3-surface-container-high/60">
                {notes.length}
              </span>
            )}
          </button>
        </div>

        {/* Sidebar Footer: User Profile */}
        <div className="p-3 border-t border-m3-outline-variant/15 flex-shrink-0">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-3 p-2 rounded-[16px] hover:bg-m3-surface-container transition-colors focus:outline-none"
            title="Открыть профиль"
          >
            <div className="w-10 h-10 rounded-full bg-m3-surface-container-high flex items-center justify-center font-nunito font-bold text-[15px] text-m3-on-surface flex-shrink-0 shadow">
              {userInitial}
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0 text-left">
                <div className="font-nunito font-bold text-[14px] text-m3-on-surface truncate">
                  {currentUser.first_name || currentUser.username || currentUser.google_email || 'Пользователь'}
                </div>
                <div className="font-nunito text-[11px] text-m3-on-surface-variant truncate">
                  {currentUser.google_email || (currentUser.username ? `@${currentUser.username}` : 'Bars аккаунт')}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ─── 2. MIDDLE PANEL: NOTES LIST (Apple Notes List View) ──────── */}
      <section className="w-[340px] h-full flex flex-col bg-m3-surface-container-lowest border-r border-m3-outline-variant/20 flex-shrink-0">
        {/* Search Bar on Top */}
        <div className="p-3 border-b border-m3-outline-variant/15 flex-shrink-0">
          <GlassSearchBar
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            placeholderText="Поиск по трекам..."
            className="h-[44px]"
          />
        </div>

        {/* Pinned Invitations Banner */}
        {pendingInvitations.length > 0 && (
          <div className="p-3 border-b border-m3-outline-variant/15">
            <div className="rounded-[18px] bg-m3-surface-container-high border border-m3-primary/35 p-3">
              <div className="text-m3-primary font-nunito font-bold text-[12px]">
                Приглашение в соавторы ({pendingInvitations.length})
              </div>
              <div className="text-m3-on-surface font-nunito font-bold text-[14px] truncate">
                «{pendingInvitations[0].note_title || 'Без названия'}»
              </div>
              <div className="text-m3-on-surface-variant text-[12px] truncate">
                От: {pendingInvitations[0].inviter_name || 'Пользователь'}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => onDeclineInvitation(pendingInvitations[0].id)}
                  className="px-2.5 py-1 text-m3-outline text-[12px] font-nunito hover:text-m3-on-surface"
                >
                  Отклонить
                </button>
                <button
                  onClick={() => onAcceptInvitation(pendingInvitations[0].id)}
                  className="px-3 py-1 rounded-full bg-m3-primary text-[#041E49] text-[12px] font-nunito font-bold"
                >
                  Принять
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-m3-outline">
              <MaterialIcon name="search_off" size={48} className="mb-2 text-m3-outline" />
              <div className="font-nunito font-semibold text-[15px] text-m3-on-surface-variant">
                Ничего не найдено
              </div>
              <div className="text-[13px]">
                {searchQuery ? 'Попробуйте изменить запрос' : 'В этом разделе пока нет заметок'}
              </div>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category.name} className="mb-3">
                <div className="text-m3-outline font-nunito font-bold text-[12px] px-2 py-1 uppercase tracking-wider">
                  {group.category.title}
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  {group.notes.map((note) => {
                    const isSelected = note.id === currentNoteId;
                    const isTrack = Boolean(note.title && note.title.trim().length > 0);
                    const noteTitle = isTrack
                      ? note.title
                      : (note.content?.split(/\r?\n/)[0]?.trim() || 'Пустой набросок');
                    const notePreview = isTrack ? (note.content?.split(/\r?\n/)[0]?.trim() || '') : '';

                    return (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note.id)}
                        className={`group relative p-3 rounded-[16px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-m3-surface-container-high border-l-4 border-m3-primary shadow'
                            : 'bg-m3-surface-container/60 hover:bg-m3-surface-container hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {note.is_shared && (
                              <MaterialIcon name="group" size={16} filled className="text-[#A8C7FA] flex-shrink-0" />
                            )}
                            <span className={`font-nunito text-[15px] leading-5 truncate ${isSelected ? 'font-bold text-m3-on-surface' : 'font-semibold text-m3-on-surface/90'}`}>
                              {noteTitle}
                            </span>
                          </div>

                          <span className="text-m3-on-surface-variant text-[11px] flex-shrink-0">
                            {formatDisplayDate(note.updated_at || note.created_at)}
                          </span>
                        </div>

                        {note.is_shared && note.owner_name && (
                          <div className="mt-0.5 text-m3-primary/85 text-[11px] truncate font-nunito">
                            Автор: {note.owner_name}
                          </div>
                        )}

                        {notePreview && (
                          <div className="mt-1 text-m3-on-surface-variant text-[12px] leading-4 truncate font-nunito">
                            {notePreview}
                          </div>
                        )}

                        {/* Quick hover delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="absolute right-2 bottom-2 w-7 h-7 rounded-full bg-m3-surface-container-highest text-m3-outline hover:text-m3-error hover:bg-m3-error-container/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                          title="Удалить заметку"
                        >
                          <MaterialIcon name="delete" size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── 3. RIGHT PANEL: NOTE EDITOR & AI RHYMES PANE ────────────── */}
      <main className="flex-1 h-full flex flex-row overflow-hidden bg-m3-bg relative">
        {activeNote ? (
          <>
            {/* Main Text Editor Section */}
            <div className="flex-1 h-full flex flex-col overflow-hidden">
              {/* Top Action Bar (Pinned Top-Right) */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-m3-outline-variant/15 flex-shrink-0 bg-m3-bg/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-m3-on-surface-variant font-nunito text-[13px] font-medium">
                    {activeNote.title ? 'Треки' : 'Наброски'}
                  </span>
                  <span className="text-m3-outline">/</span>
                  <span className="text-m3-on-surface font-nunito text-[13px] font-semibold truncate max-w-xs">
                    {activeNote.title || 'Без названия'}
                  </span>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Collaborators Button */}
                  <button
                    onClick={() => {
                      onRefreshCollab();
                      setShowCollabModal(true);
                    }}
                    className={`h-10 px-3.5 rounded-full flex items-center gap-2 transition-all focus:outline-none ${
                      activeNote.is_shared || collaborators.length > 0
                        ? 'bg-m3-primary-container text-m3-on-primary-container font-bold'
                        : 'bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-surface-container-highest font-medium'
                    }`}
                    title="Совместный доступ"
                  >
                    <MaterialIcon
                      name="group"
                      size={18}
                      filled={activeNote.is_shared || collaborators.length > 0}
                    />
                    <span className="font-nunito text-[13px]">Соавторы</span>
                  </button>

                  {/* AI Rhymes Toggle Button */}
                  <button
                    onClick={() => setIsAiPaneOpen(!isAiPaneOpen)}
                    className={`h-10 px-3.5 rounded-full flex items-center gap-2 transition-all focus:outline-none ${
                      isAiPaneOpen
                        ? 'bg-m3-primary text-[#041E49] font-bold shadow'
                        : 'bg-m3-surface-container-high text-m3-on-surface hover:bg-m3-surface-container-highest font-medium'
                    }`}
                    title="Рифмы AI"
                  >
                    <MaterialIcon
                      name="auto_awesome"
                      size={18}
                      filled={isAiPaneOpen}
                    />
                    <span className="font-nunito text-[13px]">Рифмы AI</span>
                  </button>

                  {/* Save Status */}
                  <div className="px-1">
                    <SaveStatusIndicator state={saveState} />
                  </div>

                  {/* Delete Button */}
                  <GlassIconButton
                    onClick={() => setShowDeleteConfirm(true)}
                    ariaLabel="Удалить заметку"
                    icon={
                      <MaterialIcon
                        name="delete"
                        size={18}
                        className="text-m3-error"
                      />
                    }
                  />
                </div>
              </div>

              {/* Editor Workspace Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl w-full mx-auto flex flex-col">
                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Название трека"
                  className="w-full bg-transparent border-none text-m3-on-surface font-nunito font-bold text-[28px] leading-tight placeholder:text-m3-outline focus:outline-none mb-4 flex-shrink-0"
                />

                {/* Lyrics Body */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Пиши текст трека..."
                  className="flex-1 w-full bg-transparent border-none text-m3-on-surface font-nunito text-[16px] leading-[26px] placeholder:text-m3-outline focus:outline-none resize-none overflow-y-auto"
                />
              </div>
            </div>

            {/* Desktop Side AI Rhymes Pane */}
            {isAiPaneOpen && (
              <div className="w-[360px] h-full flex-shrink-0 border-l border-m3-outline-variant/20 p-3 bg-m3-surface-container-lowest">
                <AiRhymesPanel
                  chatHistory={chatHistory}
                  isLoading={isAiLoading}
                  onSendQuery={onSendAiQuery}
                  onRhymeSelected={handleRhymeSelected}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty Workspace State */
          <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 text-m3-outline">
            <div className="w-20 h-20 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-outline mb-4">
              <MaterialIcon name="music_note" size={40} />
            </div>
            <div className="font-nunito font-bold text-[20px] text-m3-on-surface mb-2">
              Выберите заметку для просмотра
            </div>
            <div className="font-nunito text-[14px] text-m3-on-surface-variant max-w-sm mb-6">
              Или создайте новый трек, чтобы начать писать текст с подбором сочных рифм от AI
            </div>
            <button
              onClick={() => onNewNote(false)}
              className="px-6 py-3 rounded-full bg-m3-primary text-[#041E49] font-nunito font-bold text-[14px] flex items-center gap-2 shadow hover:brightness-105 active:scale-95 transition-all focus:outline-none"
            >
              <MaterialIcon name="add" size={18} weight={600} />
              <span>Написать трек</span>
            </button>
          </div>
        )}
      </main>

      {/* Collaborators Modal */}
      <CollaboratorsSheet
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
        collaborators={collaborators}
        sentInvitations={sentInvitations}
        availableUsers={availableUsers}
        currentUserId={currentUser.id}
        ownerId={activeNote?.owner_id || null}
        ownerName={activeNote?.owner_name || null}
        isLoading={isCollabLoading}
        onInviteUser={onInviteUser}
        onCancelInvite={onCancelInvite}
        onRemoveCollaborator={onRemoveCollaborator}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowProfileModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-[24px] bg-m3-surface-container shadow-2xl overflow-hidden border border-m3-outline-variant/30">
            <ProfileScreen
              user={currentUser}
              onBack={() => setShowProfileModal(false)}
              onLogout={() => {
                setShowProfileModal(false);
                onLogout();
              }}
              onLinkGoogle={onLinkGoogle}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-sm rounded-[24px] bg-m3-surface-container-high p-6 shadow-2xl flex flex-col gap-3 border border-m3-outline-variant/30">
            <div className="font-nunito font-bold text-[18px] text-m3-on-surface">
              Удалить трек?
            </div>
            <div className="font-nunito text-[14px] text-m3-on-surface-variant leading-5">
              Это действие нельзя будет отменить.
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-full text-m3-on-surface font-nunito font-medium text-[14px] focus:outline-none"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  if (currentNoteId) {
                    await onDeleteNote(currentNoteId);
                  }
                }}
                className="px-4 py-2 rounded-full bg-m3-error-container text-m3-error font-nunito font-bold text-[14px] focus:outline-none active:scale-95 transition-transform"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
