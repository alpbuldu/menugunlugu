-- Menü Günlüğü: Tarif kalori ve süre kolonları
-- Supabase Dashboard → SQL Editor'da çalıştırın

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS kcal_per_person   integer;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time_minutes  integer;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time_minutes  integer;
