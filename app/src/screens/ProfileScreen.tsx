import React from 'react';
import { UserProfile } from '../types';
import { GlassIconButton } from '../components/GlassIconButton';
import { MaterialIcon } from '../components/MaterialIcon';

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
        style={{ paddingTop: 'calc(var(--mobile-top-padding, 94px) + 10px)' }}
      >
        <GlassIconButton
          onClick={onBack}
          ariaLabel="Назад"
          icon={<MaterialIcon name="arrow_back" size={22} />}
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
          <MaterialIcon name="person" size={54} />
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
              <MaterialIcon name="check_circle" size={18} />
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
          <MaterialIcon name="logout" size={18} />
          <span>Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
};
