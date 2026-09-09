export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string | number;
  updated_at: string | number;
  is_shared?: boolean;
  owner_id?: string | null;
  owner_name?: string | null;
}

export interface UserProfile {
  id: string;
  telegram_id?: number | null;
  auth_id?: string | null;
  google_email?: string | null;
  first_name: string;
  username?: string;
  is_guest: boolean;
}

export interface NoteCollaborator {
  id: string;
  note_id: string;
  user_id: string;
  role: string; // 'owner' | 'editor'
  profile?: UserProfile;
}

export interface NoteInvitation {
  id: string;
  note_id: string;
  note_title: string;
  inviter_id: string;
  inviter_name: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string | number;
}

export interface RhymeMessage {
  id: string;
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
  timestamp?: number;
}

export type TabType = 'tracks' | 'drafts' | 'search';

export type SaveState = 'idle' | 'saving' | 'saved';

export interface GroupedNotes {
  category: {
    name: string;
    title: string;
    order: number;
  };
  notes: Note[];
}
