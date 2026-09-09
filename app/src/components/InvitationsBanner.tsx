import React from 'react';
import { NoteInvitation } from '../types';

interface InvitationsBannerProps {
  invitations: NoteInvitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export const InvitationsBanner: React.FC<InvitationsBannerProps> = ({
  invitations,
  onAccept,
  onDecline,
}) => {
  if (invitations.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 z-20">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="w-full rounded-[20px] bg-m3-surface-container-high border border-m3-primary/35 shadow-lg p-3.5 flex flex-col select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-m3-primary-container/70 flex items-center justify-center flex-shrink-0 text-m3-primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-m3-primary font-nunito font-bold text-[12px] leading-4">
                Приглашение в соавторы
              </div>
              <div className="text-m3-on-surface font-nunito font-bold text-[15px] leading-5 truncate">
                «{inv.note_title || 'Без названия'}»
              </div>
              <div className="text-m3-on-surface-variant font-nunito text-[13px] leading-4 truncate">
                От автора: {inv.inviter_name || 'Пользователь'}
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              onClick={() => onDecline(inv.id)}
              className="px-3 py-1.5 rounded-full text-m3-outline text-[13px] font-nunito hover:text-m3-on-surface transition-colors focus:outline-none"
            >
              Отклонить
            </button>

            <button
              onClick={() => onAccept(inv.id)}
              className="h-[34px] px-4 rounded-full bg-m3-primary text-[#041E49] text-[13px] font-nunito font-bold flex items-center justify-center shadow transition-transform active:scale-95 focus:outline-none"
            >
              Принять
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
