-- Alt kategoriler: recipes tablosuna text[] sütunu ekle
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS subcategories text[] DEFAULT '{}';

-- Mevcut kayıtlar için boş array
UPDATE recipes SET subcategories = '{}' WHERE subcategories IS NULL;
