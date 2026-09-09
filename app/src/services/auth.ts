import { supabase, supabaseFetch } from './supabase';
import { UserProfile } from '../types';

export const APP_URL = window.location.origin;

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: APP_URL,
    },
  });
  if (error) {
    throw error;
  }
}

export async function linkGoogleAccount(currentUserId: string) {
  sessionStorage.setItem('bars_linking_profile_id', currentUserId);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: APP_URL,
    },
  });
  if (error) {
    sessionStorage.removeItem('bars_linking_profile_id');
    throw error;
  }
}

export async function getOrCreateProfileFromSession(session: any): Promise<UserProfile> {
  const authUser = session?.user;
  if (!authUser) throw new Error('No user in session');

  const linkingProfileId = sessionStorage.getItem('bars_linking_profile_id');
  if (linkingProfileId) {
    sessionStorage.removeItem('bars_linking_profile_id');
    try {
      const updated = await supabaseFetch<UserProfile[]>(`/profiles?id=eq.${linkingProfileId}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          auth_id: authUser.id,
          google_email: authUser.email,
        }),
      });
      if (updated && updated[0]) return updated[0];
    } catch (e) {
      console.error('[Auth] Failed to link profile:', e);
    }
  }

  // 1. Look up existing profile by auth_id
  try {
    const profiles = await supabaseFetch<UserProfile[]>(`/profiles?auth_id=eq.${authUser.id}&select=*`);
    if (profiles && profiles.length > 0) {
      return profiles[0];
    }
  } catch (e) {
    console.warn('[Auth] Error looking up profile by auth_id:', e);
  }

  // 2. Look up by google_email
  if (authUser.email) {
    try {
      const profiles = await supabaseFetch<UserProfile[]>(`/profiles?google_email=eq.${encodeURIComponent(authUser.email)}&select=*`);
      if (profiles && profiles.length > 0) {
        await supabaseFetch(`/profiles?id=eq.${profiles[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ auth_id: authUser.id }),
        });
        profiles[0].auth_id = authUser.id;
        return profiles[0];
      }
    } catch (e) {
      console.warn('[Auth] Error looking up profile by email:', e);
    }
  }

  // 3. Create new profile
  try {
    const newProfile = {
      auth_id: authUser.id,
      google_email: authUser.email || '',
      first_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Пользователь',
      username: '',
      is_guest: false,
    };
    const created = await supabaseFetch<UserProfile[]>('/profiles', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(newProfile),
    });
    if (created && created[0]) {
      return created[0];
    }
  } catch (e) {
    console.warn('[Auth] Profile creation failed:', e);
  }

  // 4. In-memory fallback
  return {
    id: authUser.id,
    auth_id: authUser.id,
    google_email: authUser.email || '',
    first_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Пользователь',
    username: '',
    is_guest: false,
  };
}

export async function checkTelegramUser(): Promise<UserProfile | null> {
  const tg = (window as any).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;

  if (!tgUser || !tgUser.id) return null;

  document.body.classList.add('in-tg');
  if (typeof tg.ready === 'function') tg.ready();
  if (typeof tg.expand === 'function') tg.expand();

  try {
    let profiles = await supabaseFetch<UserProfile[]>(`/profiles?telegram_id=eq.${tgUser.id}&select=*`).catch(() => null);
    let profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (!profile) {
      let created = await supabaseFetch<UserProfile[]>('/profiles', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          first_name: tgUser.first_name || '',
          username: tgUser.username || '',
          is_guest: false,
        }),
      }).catch(() => null);
      profile = created ? created[0] : null;
    }
    return profile;
  } catch {
    return null;
  }
}

export async function signOutUser() {
  await supabase.auth.signOut();
}
