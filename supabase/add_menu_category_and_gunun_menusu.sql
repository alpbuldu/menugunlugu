-- Menü kategorisi ve günün menüsü flag'i ekleniyor
ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS menu_category text,
  ADD COLUMN IF NOT EXISTS is_gunun_menusu boolean NOT NULL DEFAULT true;
