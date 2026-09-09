import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteCollaborator, NoteInvitation, RhymeMessage, SaveState, UserProfile } from '../types';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import { GlassIconButton } from '../components/GlassIconButton';
import { BottomSheet } from '../components/BottomSheet';
import { AiRhymesPanel } from './AiRhymesPanel';
import { CollaboratorsSheet } from './CollaboratorsSheet';

interface NoteEditorScreenProps {
  note: Note | null;
  onBack: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  saveState: SaveState;
  // AI
  chatHistory: RhymeMessage[];
  isAiLoading: boolean;
  onSendAiQuery: (query: string) => void;
  // Collaboration
  collaborators: NoteCollaborator[];
  sentInvitations: NoteInvitation[];
  availableUsers: UserProfile[];
  currentUserId: string;
  isCollabLoading: boolean;
  onInviteUser: (user: UserProfile) => void;
  onCancelInvite: (inviteId: string) => void;
  onRemoveCollaborator: (userId: string) => void;
  onRefreshCollab: () => void;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
  note,
  onBack,
  onSave,
  onDelete,
  saveState,
  chatHistory,
  isAiLoading,
  onSendAiQuery,
  collaborators,
  sentInvitations,
  availableUsers,
  currentUserId,
  isCollabLoading,
  onInviteUser,
  onCancelInvite,
  onRemoveCollaborator,
  onRefreshCollab,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isAiSplitOpen, setIsAiSplitOpen] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showCollabSheet, setShowCollabSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const isTypingRef = useRef(false);
  const autoSaveTimerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current = title;
    contentRef.current = content;
  }, [title, content]);

  // Sync if note changes from parent (e.g. remote update)
  useEffect(() => {
    if (note && !isTypingRef.current) {
      setTitle(note.title || '');
      setContent(note.content || '');
    }
  }, [note?.title, note?.content]);

  const scheduleSave = (newTitle: string, newContent: string) => {
    isTypingRef.current = true;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      await onSave(newTitle, newContent);
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

  const isShared = Boolean(note?.is_shared || collaborators.length > 0);

  return (
    <div className="relative w-full h-full min-h-screen bg-m3-bg flex flex-col overflow-hidden select-none">
      {/* Top Action Bar (Pinned) */}
      <div className="w-full flex items-center justify-between px-4 py-3 z-30 flex-shrink-0 bg-m3-bg/80 backdrop-blur-md">
        <GlassIconButton
          onClick={onBack}
          ariaLabel="Назад"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          }
        />

        <div className="flex items-center gap-2">
          {isShared && (
            <GlassIconButton
              onClick={() => {
                onRefreshCollab();
                setShowCollabSheet(true);
              }}
              ariaLabel="Соавторы"
              className="text-m3-primary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8C7FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          )}

          <SaveStatusIndicator state={saveState} />

          <GlassIconButton
            onClick={() => setShowMoreSheet(true)}
            ariaLabel="Опции"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Main Section */}
      <div className="flex-1 w-full flex flex-col overflow-hidden px-4 pb-16">
        {/* Editor Inputs */}
        <div
          className={`w-full flex flex-col transition-all duration-300 ${
            isAiSplitOpen ? 'h-[46%]' : 'h-full'
          }`}
        >
          {/* Note Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Название трека"
            className="w-full bg-transparent border-none text-m3-on-surface font-nunito font-bold text-[24px] leading-8 placeholder:text-m3-outline focus:outline-none py-1 flex-shrink-0"
          />

          <div className="h-2 flex-shrink-0" />

          {/* Note Lyrics Body */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Пиши текст трека..."
            className="flex-1 w-full bg-transparent border-none text-m3-on-surface font-nunito text-[16px] leading-6 placeholder:text-m3-outline focus:outline-none resize-none py-1 overflow-y-auto"
          />
        </div>

        {/* AI Rhymes Split Panel */}
        {isAiSplitOpen && (
          <div className="h-[54%] w-full pt-2 pb-2">
            <AiRhymesPanel
              chatHistory={chatHistory}
              isLoading={isAiLoading}
              onSendQuery={onSendAiQuery}
              onRhymeSelected={handleRhymeSelected}
            />
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-3 left-4 z-30 select-none">
        <button
          onClick={() => setIsAiSplitOpen(!isAiSplitOpen)}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 focus:outline-none ${
            isAiSplitOpen
              ? 'bg-m3-primary-container text-m3-on-primary-container'
              : 'bg-m3-surface-container-high text-m3-on-surface'
          }`}
          title="Рифмы AI"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={isAiSplitOpen ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>
      </div>

      {/* Options Bottom Sheet */}
      <BottomSheet isOpen={showMoreSheet} onClose={() => setShowMoreSheet(false)}>
        <div className="flex flex-col gap-3 pt-1 select-none">
          <div className="font-nunito font-bold text-[18px] text-m3-on-surface px-1 mb-1">
            Опции
          </div>

          {/* Option: Collaboration */}
          <button
            onClick={() => {
              setShowMoreSheet(false);
              onRefreshCollab();
              setShowCollabSheet(true);
            }}
            className="w-full rounded-[18px] bg-m3-surface-container-high p-4 flex items-center gap-3.5 text-left active:bg-m3-surface-container-highest transition-colors focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-m3-primary-container/50 text-m3-primary flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div>
              <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5">
                Совместный доступ
              </div>
              <div className="font-nunito text-[12px] text-m3-on-surface-variant">
                Пригласить соавторов и управлять доступом
              </div>
            </div>
          </button>

          {/* Option: Delete Note */}
          <button
            onClick={() => {
              setShowMoreSheet(false);
              setShowDeleteModal(true);
            }}
            className="w-full rounded-[18px] bg-m3-surface-container-high p-4 flex items-center gap-3.5 text-left active:bg-m3-surface-container-highest transition-colors focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-m3-error-container/40 text-m3-error flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div>
              <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5">
                Удалить трек
              </div>
              <div className="font-nunito text-[12px] text-m3-on-surface-variant">
                Удалить эту заметку навсегда
              </div>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Collaborators Sheet */}
      <CollaboratorsSheet
        isOpen={showCollabSheet}
        onClose={() => setShowCollabSheet(false)}
        collaborators={collaborators}
        sentInvitations={sentInvitations}
        availableUsers={availableUsers}
        currentUserId={currentUserId}
        ownerId={note?.owner_id || null}
        ownerName={note?.owner_name || null}
        isLoading={isCollabLoading}
        onInviteUser={onInviteUser}
        onCancelInvite={onCancelInvite}
        onRemoveCollaborator={onRemoveCollaborator}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowDeleteModal(false)}
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
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-full text-m3-on-surface font-nunito font-medium text-[14px] focus:outline-none"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  setShowDeleteModal(false);
                  await onDelete();
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
