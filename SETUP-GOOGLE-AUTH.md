# Настройка Google Auth для Bars

## Шаг 1: SQL-миграция в Supabase

1. Открой Supabase Dashboard: https://supabase.com/dashboard/project/bnregnrapuvjtwufvmzn
2. Перейди в **SQL Editor** → **New query**
3. Скопируй и выполни содержимое `supabase-migration.sql` (лежит рядом)

## Шаг 2: Создать Google OAuth credentials

1. Открой Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Создай проект (или выбери существующий)
3. Перейди в **APIs & Services** → **OAuth consent screen**
   - Выбери **External**
   - Заполни название приложения, email поддержки
   - В **Authorized domains** добавь `bnregnrapuvjtwufvmzn.supabase.co` и `vercel.app`
   - Сохрани
4. Перейди в **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Bars`
   - Authorized redirect URIs добавь:
     ```
     https://bnregnrapuvjtwufvmzn.supabase.co/auth/v1/callback
     ```
   - Создай
5. Сохрани **Client ID** и **Client Secret**

## Шаг 3: Включить Google Provider в Supabase

1. В Supabase Dashboard перейди в **Authentication** → **Providers**
2. Найди **Google** и включи его
3. Вставь **Client ID** и **Client Secret** из шага 2
4. В **Authorized Client IDs** добавь:
   - Client ID для Web (из шага 2)
   - Client ID для Android (создай отдельный — понадобится потом для Capacitor)
5. Сохрани

## Шаг 4: Добавить Redirect URL на Vercel

В Google Cloud Console, в OAuth client → **Authorized redirect URIs** добавь URL твоего Vercel деплоя:
```
https://твой-проект.vercel.app
```

## Шаг 5: Проверить

1. Деплой обновлённый `index.html` на Vercel
2. Открой сайт не из Telegram — увидишь экран входа с кнопкой Google
3. Войди — создастся профиль
4. Зайди из Telegram → профиль → увидишь статус "Google не привязан"
5. Нажми "Привязать Google" → профиль свяжется

## Структура profiles после миграции

| Колонка | Тип | Описание |
|---|---|---|
| id | uuid PK | ID профиля |
| telegram_id | bigint? | Telegram user ID |
| auth_id | uuid? | Supabase Auth UUID (Google) |
| google_email | text? | Email от Google |
| first_name | text | Имя |
| username | text | Telegram username |
| is_guest | bool | Гостевой режим |
