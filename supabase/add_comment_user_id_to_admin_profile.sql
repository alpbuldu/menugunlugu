-- Admin yorum hesabı: admin_profile'a comment_user_id alanı ekle
ALTER TABLE admin_profile
  ADD COLUMN IF NOT EXISTS comment_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
