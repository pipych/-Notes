import React from 'react';
import { UserProfile } from '../types';
import { GlassIconButton } from '../components/GlassIconButton';

interface ProfileScreenProps {
  user: UserProfile;
  onBack: () => void;
  onLogout: () => void;
  onLinkGoogle: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onBack,
  onLogout,
  onLinkGoogle,
}) => {
  const isGoogleLinked = Boolean(user.google_email || user.auth_id);
  const displayName = user.first_name || (user.username ? `@${user.username}` : '') || user.google_email || 'Пользователь';

  return (
    <div className="relative w-full h-[100dvh] bg-m3-bg flex flex-col px-5 pb-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div
        className="w-full flex items-center justify-between pb-2 flex-shrink-0 z-20"
        style={{ paddingTop: 'calc(var(--mobile-top-padding, 76px) + 8px)' }}
      >
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

        <span className="font-nunito font-bold text-m3-on-background text-[17px]">
          Профиль
        </span>

        <div className="w-11" />
      </div>

      {/* Main Profile Info */}
      <div className="flex-1 flex flex-col items-center pt-6">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-m3-surface-container-high flex items-center justify-center text-m3-on-surface shadow-md">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* User Name */}
        <div className="mt-4 font-nunito font-bold text-[24px] text-m3-on-surface">
          {displayName}
        </div>

        {user.google_email && (
          <div className="mt-1 font-nunito text-[14px] text-m3-on-surface-variant">
            {user.google_email}
          </div>
        )}

        {user.username && !user.google_email && (
          <div className="mt-1 font-nunito text-[14px] text-m3-on-surface-variant">
            @{user.username}
          </div>
        )}

        {/* Synchronization Card */}
        <div className="w-full max-w-sm mt-8 rounded-[20px] bg-m3-surface-container p-5 flex flex-col items-center gap-3.5 shadow">
          <div className="font-nunito font-semibold text-[14px] text-m3-on-surface-variant">
            Синхронизация
          </div>

          {isGoogleLinked ? (
            <div className="px-4 py-2 rounded-full bg-m3-success-container flex items-center gap-2 text-m3-success text-[13px] font-nunito font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Google аккаунт синхронизирован</span>
            </div>
          ) : (
            <button
              onClick={onLinkGoogle}
              className="px-5 py-2.5 rounded-full bg-m3-primary text-[#041E49] font-nunito font-bold text-[14px] flex items-center gap-2 active:scale-95 transition-transform"
            >
              Привязать Google
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full max-w-xs mb-8 py-3 rounded-full bg-m3-error-container text-m3-on-error-container font-nunito font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-transform focus:outline-none shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
};
