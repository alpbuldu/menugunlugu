-- ============================================================
-- Menü Günlüğü — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. RECIPES TABLE
CREATE TABLE IF NOT EXISTS recipes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  category     TEXT        NOT NULL CHECK (category IN ('soup', 'main', 'side', 'dessert')),
  ingredients  TEXT        NOT NULL,
  instructions TEXT        NOT NULL,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MENUS TABLE
CREATE TABLE IF NOT EXISTS menus (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE        NOT NULL UNIQUE,
  soup_id    UUID        NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  main_id    UUID        NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  side_id    UUID        NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  dessert_id UUID        NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
  status     TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS menus_date_idx   ON menus (date);
CREATE INDEX IF NOT EXISTS menus_status_idx ON menus (status);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes (category);
CREATE INDEX IF NOT EXISTS recipes_slug_idx ON recipes (slug);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus   ENABLE ROW LEVEL SECURITY;

-- Anyone can read recipes
CREATE POLICY "Public can read recipes"
  ON recipes FOR SELECT
  USING (true);

-- Anyone can read published menus only
CREATE POLICY "Public can read published menus"
  ON menus FOR SELECT
  USING (status = 'published');

-- Authenticated users (admin) can do everything
CREATE POLICY "Authenticated can insert recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert menus"
  ON menus FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update menus"
  ON menus FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete menus"
  ON menus FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- STORAGE BUCKET FOR RECIPE IMAGES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view recipe images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated can upload recipe images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated can delete recipe images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipe-images');

-- ============================================================
-- SEED: Sample data to test with
-- ============================================================

INSERT INTO recipes (title, slug, category, ingredients, instructions) VALUES
(
  'Mercimek Çorbası',
  'mercimek-corbasi',
  'soup',
  '1 su bardağı kırmızı mercimek
1 adet soğan
2 diş sarımsak
1 adet havuç
2 yemek kaşığı tereyağı
1 çay kaşığı kimyon
Tuz, karabiber',
  '1. Mercimeği yıkayın.
2. Soğan ve sarımsağı kavurun.
3. Havuç ve mercimeği ekleyin.
4. 4-5 su bardağı su ile pişirin.
5. Blender ile püre yapın.
6. Kimyon ve tereyağı ile tatlandırın.'
),
(
  'Fırın Tavuk',
  'firin-tavuk',
  'main',
  '1 bütün tavuk (yaklaşık 1.5 kg)
4 diş sarımsak
2 yemek kaşığı zeytinyağı
1 limon
1 çay kaşığı kekik
1 çay kaşığı pul biber
Tuz, karabiber',
  '1. Fırını 200°C''ye ısıtın.
2. Tavuğu zeytinyağı ve baharatlarla ovun.
3. İçine limon ve sarımsak koyun.
4. 1 saat 15 dakika pişirin.
5. Üzeri kızarana kadar bekleyin.'
),
(
  'Pilav',
  'pilav',
  'side',
  '2 su bardağı pirinç
3 su bardağı su
2 yemek kaşığı tereyağı
Tuz',
  '1. Pirinci yıkayın ve 30 dk suda bekletin.
2. Tereyağını tencerede eritin.
3. Pirinci kavurun.
4. Suyu ve tuzu ekleyin.
5. Kaynayınca kısık ateşte 18 dk pişirin.
6. 10 dk demlenmeye bırakın.'
),
(
  'Sütlaç',
  'sutlac',
  'dessert',
  '1 lt süt
4 yemek kaşığı pirinç unu
5 yemek kaşığı şeker
1 çay kaşığı vanilya',
  '1. Sütü tencereye alın.
2. Pirinç ununu az sütle karıştırın.
3. Şeker ve vanilyayı ekleyin.
4. Sürekli karıştırarak koyulaşana kadar pişirin.
5. Kaplara alın, soğutun.'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert today's menu using the seeded recipes
INSERT INTO menus (date, soup_id, main_id, side_id, dessert_id, status)
SELECT
  CURRENT_DATE,
  (SELECT id FROM recipes WHERE slug = 'mercimek-corbasi'),
  (SELECT id FROM recipes WHERE slug = 'firin-tavuk'),
  (SELECT id FROM recipes WHERE slug = 'pilav'),
  (SELECT id FROM recipes WHERE slug = 'sutlac'),
  'published'
ON CONFLICT (date) DO NOTHING;
