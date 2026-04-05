-- ============================================================
-- Fix 1: Add slug column to recipes and auto-generate from title
-- ============================================================

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE result TEXT;
BEGIN
  result := lower(input);
  result := replace(result, 'ğ', 'g');
  result := replace(result, 'ü', 'u');
  result := replace(result, 'ş', 's');
  result := replace(result, 'ı', 'i');
  result := replace(result, 'ö', 'o');
  result := replace(result, 'ç', 'c');
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  result := regexp_replace(trim(result), '\s+', '-', 'g');
  RETURN result;
END;
$$;

UPDATE recipes SET slug = slugify(title) WHERE slug IS NULL OR slug = '';

ALTER TABLE recipes ALTER COLUMN slug SET NOT NULL;

ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_slug_key;
ALTER TABLE recipes ADD CONSTRAINT recipes_slug_key UNIQUE (slug);

CREATE INDEX IF NOT EXISTS recipes_slug_idx ON recipes (slug);

-- ============================================================
-- Fix 2: Insert today's menu (uses the 4 existing recipes)
-- ============================================================

INSERT INTO menus (date, soup_id, main_id, side_id, dessert_id, status)
SELECT
  CURRENT_DATE,
  (SELECT id FROM recipes WHERE category = 'soup'    LIMIT 1),
  (SELECT id FROM recipes WHERE category = 'main'    LIMIT 1),
  (SELECT id FROM recipes WHERE category = 'side'    LIMIT 1),
  (SELECT id FROM recipes WHERE category = 'dessert' LIMIT 1),
  'published'
ON CONFLICT (date) DO UPDATE
  SET
    soup_id    = EXCLUDED.soup_id,
    main_id    = EXCLUDED.main_id,
    side_id    = EXCLUDED.side_id,
    dessert_id = EXCLUDED.dessert_id,
    status     = 'published';
