import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteCollaborator, NoteInvitation, RhymeMessage, SaveState, UserProfile } from '../types';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import { GlassIconButton } from '../components/GlassIconButton';
import { BottomSheet } from '../components/BottomSheet';
import { MaterialIcon } from '../components/MaterialIcon';
import { shareNote } from '../utils/share';
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
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleShare = async () => {
    const res = await shareNote(title, content);
    if (res.copied) {
      setShowToast('Скопировано в буфер обмена');
      setTimeout(() => setShowToast(null), 2500);
    }
  };

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
    <div className="relative w-full h-[100dvh] bg-m3-bg flex flex-col overflow-hidden select-none">
      {/* Top Action Bar (Pinned) */}
      <div
        className="w-full flex items-center justify-between px-4 pb-3 z-30 flex-shrink-0 bg-m3-bg/85 backdrop-blur-md"
        style={{ paddingTop: 'calc(var(--mobile-top-padding, 94px) + 10px)' }}
      >
        <GlassIconButton
          onClick={onBack}
          ariaLabel="Назад"
          icon={<MaterialIcon name="arrow_back" size={22} />}
        />

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <GlassIconButton
            onClick={handleShare}
            ariaLabel="Поделиться"
            icon={<MaterialIcon name="share" size={22} />}
          />

          {isShared && (
            <GlassIconButton
              onClick={() => {
                onRefreshCollab();
                setShowCollabSheet(true);
              }}
              ariaLabel="Соавторы"
              className="text-m3-primary"
              icon={<MaterialIcon name="group" size={22} className="text-m3-primary" />}
            />
          )}

          <SaveStatusIndicator state={saveState} />

          <GlassIconButton
            onClick={() => setShowMoreSheet(true)}
            ariaLabel="Опции"
            icon={<MaterialIcon name="more_vert" size={22} />}
          />
        </div>
      </div>

      {/* Main Section */}
      <div
        className="flex-1 w-full flex flex-col overflow-hidden px-4"
        style={{ paddingBottom: 'calc(max(var(--tg-content-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px) + 54px)' }}
      >
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
      <div
        className="absolute left-4 z-30 select-none"
        style={{ bottom: 'calc(max(var(--tg-content-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px) + 12px)' }}
      >
        <button
          onClick={() => setIsAiSplitOpen(!isAiSplitOpen)}
          className={`w-11 h-11 rounded-full flex items-center justify-center bg-transparent transition-all active:scale-95 focus:outline-none ${
            isAiSplitOpen
              ? 'text-m3-primary hover:bg-m3-primary/10'
              : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-white/5'
          }`}
          title="Рифмы AI"
        >
          <MaterialIcon name="auto_awesome" filled={isAiSplitOpen} size={24} />
        </button>
      </div>

      {/* Options Bottom Sheet */}
      <BottomSheet isOpen={showMoreSheet} onClose={() => setShowMoreSheet(false)}>
        <div className="flex flex-col gap-3 pt-1 select-none">
          <div className="font-nunito font-bold text-[18px] text-m3-on-surface px-1 mb-1">
            Опции
          </div>

          {/* Option: Share */}
          <button
            onClick={() => {
              setShowMoreSheet(false);
              handleShare();
            }}
            className="w-full rounded-[18px] bg-m3-surface-container-high p-4 flex items-center gap-3.5 text-left active:bg-m3-surface-container-highest transition-colors focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-m3-primary-container/50 text-m3-primary flex items-center justify-center flex-shrink-0">
              <MaterialIcon name="share" size={22} />
            </div>
            <div>
              <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5">
                Поделиться
              </div>
              <div className="font-nunito text-[12px] text-m3-on-surface-variant">
                Отправить копию текста заметки
              </div>
            </div>
          </button>

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
              <MaterialIcon name="group" size={22} />
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
              <MaterialIcon name="delete" size={22} />
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-m3-surface-container-highest text-m3-on-surface px-4 py-2 rounded-full shadow-lg text-[13px] font-nunito font-semibold flex items-center gap-2 border border-m3-outline-variant/30">
          <MaterialIcon name="check_circle" size={18} className="text-m3-primary" />
          <span>{showToast}</span>
        </div>
      )}
    </div>
  );
};
