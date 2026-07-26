-- Миграция для добавления Google Auth в Bars
-- Запусти этот SQL в Supabase SQL Editor (https://supabase.com/dashboard/project/bnregnrapuvjtwufvmzn/sql/new)

-- 1. Добавляем колонки в profiles для Google Auth
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE,
ADD COLUMN IF NOT EXISTS google_email TEXT;

-- 2. Индекс для быстрого поиска по auth_id
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);

-- 3. Индекс для поиска по google_email
CREATE INDEX IF NOT EXISTS idx_profiles_google_email ON profiles(google_email);
