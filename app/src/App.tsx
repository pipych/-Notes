import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note, TabType, UserProfile, NoteCollaborator, NoteInvitation, RhymeMessage, SaveState } from './types';
import { supabase, supabaseFetch } from './services/supabase';
import { checkTelegramUser, getOrCreateProfileFromSession, signInWithGoogle, linkGoogleAccount, signOutUser } from './services/auth';
import { fetchAiRhymes } from './services/ai';
import { useMediaQuery } from './hooks/useMediaQuery';
import { AuthScreen } from './screens/AuthScreen';
import { NotesListScreen } from './screens/NotesListScreen';
import { NoteEditorScreen } from './screens/NoteEditorScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DesktopWorkspace } from './screens/DesktopWorkspace';
import { MaterialIcon } from './components/MaterialIcon';

export const App: React.FC = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'list' | 'editor' | 'profile'>('list');

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Collaboration
  const [pendingInvitations, setPendingInvitations] = useState<NoteInvitation[]>([]);
  const [collaborators, setCollaborators] = useState<NoteCollaborator[]>([]);
  const [sentInvitations, setSentInvitations] = useState<NoteInvitation[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isCollabLoading, setIsCollabLoading] = useState(false);

  // AI Rhymes
  const [chatHistory, setChatHistory] = useState<RhymeMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const currentUserRef = useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

  const currentNoteIdRef = useRef<string | null>(null);
  currentNoteIdRef.current = currentNoteId;

  // ─── Invitations Polling ──────────────────────────────────────────────
  const fetchPendingInvitations = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user || user.is_guest) {
      setPendingInvitations([]);
      return;
    }

    try {
      const userIds = [user.id];
      if (user.auth_id && user.auth_id !== user.id) {
        userIds.push(user.auth_id);
      }
      const filter = userIds.length > 1 ? `in.(${userIds.join(',')})` : `eq.${user.id}`;
      const res = await supabaseFetch<NoteInvitation[]>(
        `/note_invitations?invitee_id=${filter}&status=eq.pending&order=created_at.desc&select=*`
      );
      setPendingInvitations(res || []);
    } catch (e) {
      console.warn('fetchPendingInvitations error:', e);
    }
  }, []);

  // ─── Notes Loading ───────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) return;

    if (user.is_guest) {
      const saved = sessionStorage.getItem('guest_notes');
      if (saved) {
        try {
          setNotes(JSON.parse(saved));
        } catch {
          setNotes([]);
        }
      }
      return;
    }

    try {
      const userIds = [user.id];
      if (user.auth_id && user.auth_id !== user.id) {
        userIds.push(user.auth_id);
      }
      const ownerFilter = userIds.length > 1 ? `in.(${userIds.join(',')})` : `eq.${user.id}`;

      // 1. Own notes
      const ownNotes = (await supabaseFetch<Note[]>(
        `/notes?user_id=${ownerFilter}&order=updated_at.desc&select=*`
      )) || [];

      // 2. Shared notes via note_collaborators
      const collabRows = (await supabaseFetch<Array<{ note_id: string }>>(
        `/note_collaborators?user_id=${ownerFilter}&select=note_id`
      )) || [];

      let sharedNotes: Note[] = [];
      if (collabRows.length > 0) {
        const sharedNoteIds = Array.from(new Set(collabRows.map((r) => r.note_id)));
        if (sharedNoteIds.length > 0) {
          sharedNotes = (await supabaseFetch<Note[]>(
            `/notes?id=in.(${sharedNoteIds.join(',')})&select=*`
          )) || [];

          // Fetch owner names for shared notes
          const ownerIds = Array.from(new Set(sharedNotes.map((n) => n.user_id).filter(Boolean)));
          let profileMap = new Map<string, string>();
          if (ownerIds.length > 0) {
            const profiles = (await supabaseFetch<UserProfile[]>(
              `/profiles?id=in.(${ownerIds.join(',')})&select=*`
            )) || [];
            profiles.forEach((p) => {
              profileMap.set(p.id, p.first_name || p.username || p.google_email || 'Пользователь');
              if (p.auth_id) {
                profileMap.set(p.auth_id, p.first_name || p.username || p.google_email || 'Пользователь');
              }
            });
          }

          sharedNotes = sharedNotes.map((n) => ({
            ...n,
            is_shared: true,
            owner_id: n.user_id,
            owner_name: profileMap.get(n.user_id) || 'Автор',
          }));
        }
      }

      // Merge and deduplicate by note ID
      const allNotesMap = new Map<string, Note>();
      ownNotes.forEach((n) => allNotesMap.set(n.id, n));
      sharedNotes.forEach((n) => allNotesMap.set(n.id, n));

      const merged = Array.from(allNotesMap.values()).sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });

      setNotes(merged);

      // On desktop: if no note is selected and notes exist, select the first note
      if (isDesktop && !currentNoteIdRef.current && merged.length > 0) {
        setCurrentNoteId(merged[0].id);
      }
    } catch (err) {
      console.error('loadNotes error:', err);
    }
  }, [isDesktop]);

  // ─── Authentication Init ─────────────────────────────────────────────
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check Telegram environment
        const tgUser = await checkTelegramUser();
        if (tgUser) {
          setCurrentUser(tgUser);
          setIsAuthReady(true);
          return;
        }

        // 2. Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await getOrCreateProfileFromSession(session);
          setCurrentUser(profile);

          if (window.location.hash || window.location.search.includes('code=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (e) {
        console.error('initAuth error:', e);
      } finally {
        setIsAuthReady(true);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await getOrCreateProfileFromSession(session);
        setCurrentUser(profile);
      } else {
        if (!document.body.classList.contains('in-tg')) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When user is authenticated, load data and start interval polling
  useEffect(() => {
    if (currentUser) {
      loadNotes();
      fetchPendingInvitations();

      const pollTimer = setInterval(() => {
        fetchPendingInvitations();
      }, 15000);

      return () => clearInterval(pollTimer);
    }
  }, [currentUser, loadNotes, fetchPendingInvitations]);

  // ─── Active Note Real-time Collaboration Polling (every 4s) ──────────
  useEffect(() => {
    if ((!isDesktop && currentScreen !== 'editor') || !currentNoteId || !currentUser || currentUser.is_guest) {
      return;
    }

    const collabInterval = setInterval(async () => {
      try {
        const updatedNotes = await supabaseFetch<Note[]>(`/notes?id=eq.${currentNoteId}&select=*`);
        if (updatedNotes && updatedNotes.length > 0) {
          const remote = updatedNotes[0];
          setNotes((prev) => {
            const current = prev.find((n) => n.id === currentNoteId);
            if (current && new Date(remote.updated_at).getTime() > new Date(current.updated_at).getTime()) {
              return prev.map((n) => (n.id === currentNoteId ? { ...n, ...remote } : n));
            }
            return prev;
          });
        }
      } catch {
        // quiet polling error
      }
    }, 4000);

    return () => clearInterval(collabInterval);
  }, [isDesktop, currentScreen, currentNoteId, currentUser]);

  // ─── Telegram WebApp Native Back Button ─────────────────────────────
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    if (currentScreen === 'editor' || currentScreen === 'profile') {
      tg.BackButton.show();
      const handleTgBack = () => {
        if (currentScreen === 'editor') {
          setCurrentScreen('list');
          setCurrentNoteId(null);
        } else if (currentScreen === 'profile') {
          setCurrentScreen('list');
        }
      };
      tg.BackButton.onClick(handleTgBack);
      return () => {
        tg.BackButton.offClick(handleTgBack);
      };
    } else {
      tg.BackButton.hide();
    }
  }, [currentScreen]);

  // ─── Telegram WebApp Auto-fullscreen on any device ──────────────────
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      if (typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
        tg.requestFullscreen();
      }
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }
    } catch {}
  }, [currentScreen]);

  // ─── Collaboration Data for Modal ────────────────────────────────────
  const loadCollabData = useCallback(async () => {
    const noteId = currentNoteIdRef.current;
    if (!noteId) return;

    setIsCollabLoading(true);
    try {
      const [collabs, invites, users] = await Promise.all([
        supabaseFetch<NoteCollaborator[]>(`/note_collaborators?note_id=eq.${noteId}&select=*`).catch(() => []),
        supabaseFetch<NoteInvitation[]>(`/note_invitations?note_id=eq.${noteId}&status=eq.pending&select=*`).catch(() => []),
        supabaseFetch<UserProfile[]>(`/profiles?is_guest=eq.false&select=*`).catch(() => []),
      ]);

      setAvailableUsers(users || []);
      setSentInvitations(invites || []);

      const enrichedCollabs = (collabs || []).map((c) => {
        const profile = (users || []).find((u) => u.id === c.user_id || u.auth_id === c.user_id);
        return {
          ...c,
          profile,
        };
      });
      setCollaborators(enrichedCollabs);
    } catch (err) {
      console.error('loadCollabData error:', err);
    } finally {
      setIsCollabLoading(false);
    }
  }, []);

  // ─── Note Saving & Creating ──────────────────────────────────────────
  const handleSaveNote = async (newTitle: string, newContent: string) => {
    if (!newTitle.trim() && !newContent.trim()) return;

    setSaveState('saving');
    const now = new Date().toISOString();
    const user = currentUserRef.current;

    try {
      if (!user || user.is_guest) {
        if (!currentNoteId) {
          const newId = 'local_' + Date.now();
          setCurrentNoteId(newId);
          const newNote: Note = {
            id: newId,
            user_id: user?.id || 'guest',
            title: newTitle,
            content: newContent,
            created_at: now,
            updated_at: now,
          };
          setNotes((prev) => [newNote, ...prev]);
        } else {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === currentNoteId ? { ...n, title: newTitle, content: newContent, updated_at: now } : n
            )
          );
        }
      } else {
        if (!currentNoteId) {
          const created = await supabaseFetch<Note[]>('/notes', {
            method: 'POST',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify({
              user_id: user.id,
              title: newTitle,
              content: newContent,
            }),
          });
          if (created && created[0]) {
            setCurrentNoteId(created[0].id);
            setNotes((prev) => [created[0], ...prev]);
          }
        } else {
          await supabaseFetch(`/notes?id=eq.${currentNoteId}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=representation' },
            body: JSON.stringify({
              title: newTitle,
              content: newContent,
              updated_at: now,
            }),
          });
          setNotes((prev) =>
            prev.map((n) =>
              n.id === currentNoteId ? { ...n, title: newTitle, content: newContent, updated_at: now } : n
            )
          );
        }
      }

      setSaveState('saved');
    } catch (e) {
      console.error('Save note error:', e);
      setSaveState('idle');
    }
  };

  // ─── Note Deletion ───────────────────────────────────────────────────
  const handleDeleteNote = async (idToDelete?: string) => {
    const id = idToDelete || currentNoteId;
    if (!id) {
      setCurrentScreen('list');
      return;
    }

    const note = notes.find((n) => n.id === id);
    const user = currentUserRef.current;

    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);

    if (currentNoteId === id) {
      if (isDesktop && remaining.length > 0) {
        setCurrentNoteId(remaining[0].id);
      } else {
        setCurrentNoteId(null);
        setCurrentScreen('list');
      }
    }

    localStorage.removeItem('bars_chat_' + id);

    if (user && !user.is_guest && note) {
      try {
        const isOwner = !note.is_shared || note.user_id === user.id || (user.auth_id && note.user_id === user.auth_id);
        if (!isOwner) {
          const userIds = [user.id];
          if (user.auth_id) userIds.push(user.auth_id);
          await supabaseFetch(`/note_collaborators?note_id=eq.${id}&user_id=in.(${userIds.join(',')})`, {
            method: 'DELETE',
          });
        } else {
          await supabaseFetch(`/notes?id=eq.${id}`, { method: 'DELETE' });
          await supabaseFetch(`/note_collaborators?note_id=eq.${id}`, { method: 'DELETE' }).catch(() => {});
          await supabaseFetch(`/note_invitations?note_id=eq.${id}`, { method: 'DELETE' }).catch(() => {});
        }
      } catch (e) {
        console.error('Delete note error:', e);
      }
    }
  };

  // ─── Invitations Actions ─────────────────────────────────────────────
  const handleAcceptInvitation = async (invId: string) => {
    const invite = pendingInvitations.find((i) => i.id === invId);
    if (!invite || !currentUser) return;

    try {
      await supabaseFetch(`/note_invitations?id=eq.${invId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted', updated_at: new Date().toISOString() }),
      });

      await supabaseFetch('/note_collaborators', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          note_id: invite.note_id,
          user_id: currentUser.id,
          role: 'editor',
        }),
      });

      await fetchPendingInvitations();
      await loadNotes();
    } catch (e) {
      console.error('Accept invitation error:', e);
      alert('Не удалось принять приглашение');
    }
  };

  const handleDeclineInvitation = async (invId: string) => {
    try {
      await supabaseFetch(`/note_invitations?id=eq.${invId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'declined', updated_at: new Date().toISOString() }),
      });
      setPendingInvitations((prev) => prev.filter((i) => i.id !== invId));
    } catch (e) {
      console.error('Decline invitation error:', e);
    }
  };

  const handleInviteUser = async (userToInvite: UserProfile) => {
    if (!currentNoteId || !currentUser) return;

    const currentNote = notes.find((n) => n.id === currentNoteId);
    const title = currentNote?.title || 'Без названия';
    const inviterName = currentUser.first_name || (currentUser.username ? `@${currentUser.username}` : '') || currentUser.google_email || 'Пользователь';

    try {
      await supabaseFetch('/note_invitations', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          note_id: currentNoteId,
          note_title: title,
          inviter_id: currentUser.id,
          inviter_name: inviterName,
          invitee_id: userToInvite.id,
          status: 'pending',
        }),
      });
      await loadCollabData();
    } catch (err) {
      console.error('Invite user error:', err);
      alert('Ошибка при отправке приглашения');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await supabaseFetch(`/note_invitations?id=eq.${inviteId}`, { method: 'DELETE' });
      await loadCollabData();
    } catch (e) {
      console.error('Cancel invite error:', e);
    }
  };

  const handleRemoveCollaborator = async (collabUserId: string) => {
    if (!currentNoteId) return;
    try {
      await supabaseFetch(`/note_collaborators?note_id=eq.${currentNoteId}&user_id=eq.${collabUserId}`, {
        method: 'DELETE',
      });
      await loadCollabData();
    } catch (e) {
      console.error('Remove collaborator error:', e);
      alert('Ошибка при удалении соавтора');
    }
  };

  // ─── AI Rhymes Handler ───────────────────────────────────────────────
  const handleSendAiQuery = async (query: string) => {
    const userMsg: RhymeMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      parts: [{ text: query }],
      timestamp: Date.now(),
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setIsAiLoading(true);

    try {
      const reply = await fetchAiRhymes(newHistory);
      const botMsg: RhymeMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        parts: [{ text: reply }],
        timestamp: Date.now(),
      };
      const finalHistory = [...newHistory, botMsg];
      setChatHistory(finalHistory);

      if (currentNoteId) {
        localStorage.setItem('bars_chat_' + currentNoteId, JSON.stringify(finalHistory));
      }
    } catch {
      const botErr: RhymeMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        parts: [{ text: 'Ошибка при запросе к AI. Проверь подключение или ключ Gemini.' }],
        timestamp: Date.now(),
      };
      setChatHistory([...newHistory, botErr]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ─── Screen Navigation ───────────────────────────────────────────────
  const openNoteEditor = (id?: string) => {
    if (id) {
      setCurrentNoteId(id);
      const savedChat = localStorage.getItem('bars_chat_' + id);
      if (savedChat) {
        try {
          setChatHistory(JSON.parse(savedChat));
        } catch {
          setChatHistory([]);
        }
      } else {
        setChatHistory([]);
      }
    } else {
      setCurrentNoteId(null);
      setChatHistory([]);
    }
    setSaveState('idle');
    setCurrentScreen('editor');
  };

  if (!isAuthReady) {
    return (
      <div className="w-full h-screen bg-m3-bg flex items-center justify-center text-m3-primary">
        <MaterialIcon name="sync" size={40} className="animate-spin text-m3-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onGoogleSignIn={signInWithGoogle} />;
  }

  const activeNote = notes.find((n) => n.id === currentNoteId) || null;

  // ─── 🖥️ DESKTOP WORKSPACE (Apple Notes UX + Material 3 Expressive) ──
  if (isDesktop) {
    return (
      <DesktopWorkspace
        notes={notes}
        currentUser={currentUser}
        currentNoteId={currentNoteId}
        onSelectNote={(id) => openNoteEditor(id || undefined)}
        onNewNote={(_isDraft) => openNoteEditor()}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
        saveState={saveState}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        pendingInvitations={pendingInvitations}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
        collaborators={collaborators}
        sentInvitations={sentInvitations}
        availableUsers={availableUsers}
        isCollabLoading={isCollabLoading}
        onInviteUser={handleInviteUser}
        onCancelInvite={handleCancelInvite}
        onRemoveCollaborator={handleRemoveCollaborator}
        onRefreshCollab={loadCollabData}
        chatHistory={chatHistory}
        isAiLoading={isAiLoading}
        onSendAiQuery={handleSendAiQuery}
        onLogout={async () => {
          await signOutUser();
          setCurrentUser(null);
        }}
        onLinkGoogle={() => linkGoogleAccount(currentUser.id)}
      />
    );
  }

  // ─── 📱 MOBILE / TABLET WORKSPACE (Android Native 1:1) ──────────────
  return (
    <div className="w-full min-h-[100dvh] h-full bg-m3-bg text-m3-on-background font-nunito flex flex-col items-center">
      <div className="w-full max-w-md min-h-[100dvh] h-full flex flex-col relative overflow-hidden">
        {currentScreen === 'list' && (
          <NotesListScreen
            notes={notes}
            currentTab={activeTab}
            onTabChange={setActiveTab}
            onOpenNote={(id) => openNoteEditor(id)}
            onNewNote={(_isDraft) => openNoteEditor()}
            onDeleteNote={async (id) => {
              setCurrentNoteId(id);
              await handleDeleteNote();
            }}
            onOpenProfile={() => setCurrentScreen('profile')}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            pendingInvitations={pendingInvitations}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
          />
        )}

        {currentScreen === 'editor' && (
          <NoteEditorScreen
            note={activeNote}
            onBack={() => {
              setCurrentScreen('list');
              setCurrentNoteId(null);
            }}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            saveState={saveState}
            chatHistory={chatHistory}
            isAiLoading={isAiLoading}
            onSendAiQuery={handleSendAiQuery}
            collaborators={collaborators}
            sentInvitations={sentInvitations}
            availableUsers={availableUsers}
            currentUserId={currentUser.id}
            isCollabLoading={isCollabLoading}
            onInviteUser={handleInviteUser}
            onCancelInvite={handleCancelInvite}
            onRemoveCollaborator={handleRemoveCollaborator}
            onRefreshCollab={loadCollabData}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            user={currentUser}
            onBack={() => setCurrentScreen('list')}
            onLogout={async () => {
              await signOutUser();
              setCurrentUser(null);
            }}
            onLinkGoogle={() => linkGoogleAccount(currentUser.id)}
          />
        )}
      </div>
    </div>
  );
};
