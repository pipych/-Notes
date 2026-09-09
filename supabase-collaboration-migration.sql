-- ================================================================
-- Миграция: Совместное редактирование треков и система приглашений в Bars
-- Запустите этот SQL в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bnregnrapuvjtwufvmzn/sql/new
-- ================================================================

-- 1. Таблица соавторов (участников с доступом к треку)
CREATE TABLE IF NOT EXISTS note_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor', -- 'editor', 'owner'
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_note_collaborator UNIQUE (note_id, user_id)
);

-- 2. Таблица приглашений к совместному редактированию
CREATE TABLE IF NOT EXISTS note_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id TEXT NOT NULL,
    note_title TEXT DEFAULT '',
    inviter_id TEXT NOT NULL,
    inviter_name TEXT DEFAULT '',
    invitee_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_note_invitee UNIQUE (note_id, invitee_id)
);

-- 3. Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_note_collaborators_user_id ON note_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_note_collaborators_note_id ON note_collaborators(note_id);

CREATE INDEX IF NOT EXISTS idx_note_invitations_invitee_id ON note_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_note_invitations_note_id ON note_invitations(note_id);
CREATE INDEX IF NOT EXISTS idx_note_invitations_inviter_id ON note_invitations(inviter_id);

-- 4. Отключение RLS для свободного взаимодействия через REST API приложения
ALTER TABLE note_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_invitations DISABLE ROW LEVEL SECURITY;

-- 5. Позволяем анонимному и аутентифицированному доступу работать с таблицами
GRANT ALL ON TABLE note_collaborators TO anon, authenticated, service_role;
GRANT ALL ON TABLE note_invitations TO anon, authenticated, service_role;
