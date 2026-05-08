-- ============================================================
-- Bildirim Sistemi Migration
-- 1. push_tokens    — cihaz push token kayıtları
-- 2. notifications  — uygulama içi bildirimler
-- 3. site_settings  — günlük push saati sütunu ekleme
-- ============================================================

-- ── 1. push_tokens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON push_tokens(user_id);

-- Upsert için updated_at otomatik güncellenir
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_tokens_updated_at ON push_tokens;
CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_push_token_timestamp();

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi tokenlarını okuyabilir/yazabilir
CREATE POLICY "push_tokens_own_select" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_own_insert" ON push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_own_delete" ON push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- ── 2. notifications ────────────────────────────────────────
-- type değerleri:
--   push bildirimler    : 'gunun_menusu', 'admin_push'
--   uygulama içi        : 'new_follower', 'recipe_comment', 'menu_comment',
--                         'comment_tag', 'comment_reply',
--                         'recipe_approved', 'recipe_rejected',
--                         'blog_approved', 'blog_rejected'

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  data        jsonb,              -- ilgili içeriğe deep-link için ekstra bilgi
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_own_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sadece service role INSERT yapabilir (Edge Function / server)
-- (anon ve authenticated rolüne insert izni yok — service_role bypass eder)

-- ── 3. site_settings — günlük push saati ────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS daily_push_time  time   DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS push_title       text   DEFAULT 'Günün Menüsü 🍽️',
  ADD COLUMN IF NOT EXISTS push_body        text   DEFAULT 'Bugünün özel menüsü hazır! Hemen inceleyin.';
