import React, { useState } from 'react';
import { NoteCollaborator, NoteInvitation, UserProfile } from '../types';
import { BottomSheet } from '../components/BottomSheet';
import { GlassSearchBar } from '../components/GlassSearchBar';

interface CollaboratorsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: NoteCollaborator[];
  sentInvitations: NoteInvitation[];
  availableUsers: UserProfile[];
  currentUserId: string;
  ownerId: string | null;
  ownerName: string | null;
  isLoading: boolean;
  onInviteUser: (user: UserProfile) => void;
  onCancelInvite: (inviteId: string) => void;
  onRemoveCollaborator: (userId: string) => void;
}

export const CollaboratorsSheet: React.FC<CollaboratorsSheetProps> = ({
  isOpen,
  onClose,
  collaborators,
  sentInvitations,
  availableUsers,
  currentUserId,
  ownerId,
  ownerName,
  isLoading,
  onInviteUser,
  onCancelInvite,
  onRemoveCollaborator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isCurrentOwner = !ownerId || ownerId === currentUserId;
  const displayOwnerName = isCurrentOwner ? 'Вы' : (ownerName || 'Автор трека');
  const ownerInitial = displayOwnerName.trim().charAt(0).toUpperCase() || 'A';

  const filteredUsers = availableUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = (u.first_name || '').toLowerCase().includes(q);
    const userMatch = (u.username || '').toLowerCase().includes(q);
    const emailMatch = (u.google_email || '').toLowerCase().includes(q);
    const matches = !q || nameMatch || userMatch || emailMatch;

    const isSelf = u.id === currentUserId || (u.auth_id && u.auth_id === currentUserId);
    const isOwner = ownerId && (u.id === ownerId || u.auth_id === ownerId);
    const isAlreadyCollab = collaborators.some(
      (c) => c.user_id === u.id || (u.auth_id && c.user_id === u.auth_id)
    );

    return matches && !isSelf && !isOwner && !isAlreadyCollab;
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4 text-m3-on-surface select-none">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-nunito font-bold text-[20px] text-m3-on-surface">
              Совместный доступ
            </div>
            <div className="font-nunito text-[13px] text-m3-on-surface-variant">
              Редактируйте текст трека вместе с соавторами
            </div>
          </div>

          {isLoading && (
            <svg
              className="animate-spin w-5 h-5 text-m3-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>

        {/* Section 1: Participants */}
        <div>
          <div className="text-m3-outline font-nunito font-bold text-[13px] mb-2 px-1">
            Участники
          </div>

          <div className="flex flex-col gap-2">
            {/* Owner Row */}
            <div className="rounded-[16px] bg-m3-surface-container-high p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-m3-surface-container flex items-center justify-center font-nunito font-bold text-[16px] text-m3-on-surface flex-shrink-0">
                  {ownerInitial}
                </div>
                <div>
                  <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5">
                    {displayOwnerName}
                  </div>
                  <div className="font-nunito text-[12px] text-m3-on-surface-variant">
                    {isCurrentOwner ? 'Владелец заметки' : 'Создатель'}
                  </div>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-[8px] bg-m3-primary-container/50 text-m3-on-primary-container text-[12px] font-nunito font-bold">
                Создатель
              </div>
            </div>

            {/* Collaborators List */}
            {collaborators.map((c) => {
              const isSelf = c.user_id === currentUserId;
              const displayName = c.profile?.first_name || (c.profile?.username ? `@${c.profile.username}` : '') || c.profile?.google_email || 'Соавтор';
              const subtext = c.profile?.username ? `@${c.profile.username}` : (c.profile?.google_email || '');
              const initial = displayName.trim().charAt(0).toUpperCase() || 'C';

              return (
                <div
                  key={c.id}
                  className="rounded-[16px] bg-m3-surface-container-high p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-full bg-m3-surface-container flex items-center justify-center font-nunito font-bold text-[16px] text-m3-on-surface flex-shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5 truncate">
                        {isSelf ? `${displayName} (Вы)` : displayName}
                      </div>
                      {subtext && (
                        <div className="font-nunito text-[12px] text-m3-on-surface-variant truncate">
                          {subtext}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCurrentOwner && !isSelf ? (
                    <button
                      onClick={() => onRemoveCollaborator(c.user_id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-m3-error hover:bg-m3-error/10 focus:outline-none"
                      title="Удалить соавтора"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  ) : (
                    <div className="px-2.5 py-1 rounded-[8px] bg-m3-secondary-container/50 text-m3-on-secondary-container text-[12px] font-nunito">
                      Соавтор
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sent Pending Invitations */}
            {sentInvitations.map((inv) => {
              const profile = availableUsers.find(
                (u) => u.id === inv.invitee_id || u.auth_id === inv.invitee_id
              );
              const displayName = profile?.first_name || (profile?.username ? `@${profile.username}` : '') || profile?.google_email || 'Автор';
              const initial = displayName.trim().charAt(0).toUpperCase() || 'П';

              return (
                <div
                  key={inv.id}
                  className="rounded-[16px] bg-m3-surface-container-high/70 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-full bg-m3-surface-container flex items-center justify-center font-nunito font-bold text-[16px] text-m3-on-surface flex-shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="font-nunito font-semibold text-[15px] text-m3-on-surface leading-5 truncate">
                        {displayName}
                      </div>
                      <div className="font-nunito text-[12px] text-m3-on-surface-variant">
                        Ожидает подтверждения
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onCancelInvite(inv.id)}
                    className="px-3 py-1 rounded-full text-m3-outline text-[12px] font-nunito hover:text-m3-on-surface focus:outline-none"
                  >
                    Отменить
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Invite Authors */}
        <div className="mt-2">
          <div className="text-m3-outline font-nunito font-bold text-[13px] mb-2 px-1">
            Пригласить автора
          </div>

          <GlassSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            placeholderText="Поиск зарегистрированных авторов..."
            className="mb-3"
          />

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-m3-outline text-[14px] font-nunito">
                {searchQuery.trim() ? 'Никого не найдено' : 'Нет доступных авторов'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const hasSent = sentInvitations.some(
                  (inv) => inv.invitee_id === user.id || (user.auth_id && inv.invitee_id === user.auth_id)
                );
                const displayName = user.first_name || (user.username ? `@${user.username}` : '') || user.google_email || 'Пользователь';
                const subtext = user.username ? `@${user.username}` : (user.google_email || '');
                const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

                return (
                  <div
                    key={user.id}
                    className="rounded-[16px] bg-m3-surface-container-high p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-full bg-m3-surface-container flex items-center justify-center font-nunito font-bold text-[16px] text-m3-on-surface flex-shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="font-nunito font-bold text-[15px] text-m3-on-surface leading-5 truncate">
                          {displayName}
                        </div>
                        {subtext && (
                          <div className="font-nunito text-[12px] text-m3-on-surface-variant truncate">
                            {subtext}
                          </div>
                        )}
                      </div>
                    </div>

                    {hasSent ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-m3-surface-container text-m3-primary text-[12px] font-nunito font-bold">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Отправлено</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onInviteUser(user)}
                        className="h-[34px] px-3.5 rounded-full bg-m3-primary text-[#041E49] text-[13px] font-nunito font-bold flex items-center gap-1.5 shadow transition-transform active:scale-95 focus:outline-none"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#041E49"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <span>Пригласить</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
