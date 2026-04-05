-- ============================================================
-- Migration: Add slug column to recipes
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Add the slug column (nullable first so existing rows don't fail)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create a helper function to transliterate Turkish chars → ASCII
CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  result TEXT;
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

-- 3. Populate slug for all existing rows that have no slug yet
UPDATE recipes
SET slug = slugify(title)
WHERE slug IS NULL OR slug = '';

-- 4. Now make slug NOT NULL and UNIQUE
ALTER TABLE recipes ALTER COLUMN slug SET NOT NULL;
ALTER TABLE recipes ADD CONSTRAINT recipes_slug_key UNIQUE (slug);

-- 5. Add index
CREATE INDEX IF NOT EXISTS recipes_slug_idx ON recipes (slug);
