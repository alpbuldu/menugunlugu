-- ============================================================
-- Fix: Regenerate all recipe slugs as proper ASCII
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Re-create the slugify function with explicit Turkish → ASCII mapping
-- Uses translate() for character substitution (more reliable than regex in PG)
CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  result TEXT;
BEGIN
  -- 1. Lowercase
  result := lower(input);

  -- 2. Replace Turkish characters with ASCII equivalents
  result := translate(result,
    'ğüşıöç',
    'gusioc'
  );

  -- 3. Remove anything that is not a-z, 0-9, space, or hyphen
  result := regexp_replace(result, '[^a-z0-9\s\-]', '', 'g');

  -- 4. Collapse whitespace/hyphens into a single hyphen
  result := regexp_replace(trim(result), '[\s\-]+', '-', 'g');

  RETURN result;
END;
$$;

-- Regenerate slugs for all existing recipes
UPDATE recipes
SET slug = slugify(title);

-- Confirm results
SELECT id, title, slug FROM recipes ORDER BY created_at;
