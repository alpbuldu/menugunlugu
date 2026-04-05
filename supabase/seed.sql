-- ============================================================
-- Menü Günlüğü — Seed Data
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Insert 4 sample recipes
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
2. Soğan ve sarımsağı tereyağında kavurun.
3. Havuç ve mercimeği ekleyin.
4. 4-5 su bardağı su ile pişirin (yaklaşık 20 dakika).
5. Blender ile püre haline getirin.
6. Kimyon ve tuz ile tatlandırın.'
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
  '1. Fırını 200°C ye ısıtın.
2. Tavuğu zeytinyağı ve baharatlarla iyice ovun.
3. İçine limon dilimleri ve sarımsak koyun.
4. Fırın tepsisine yerleştirin.
5. 1 saat 15 dakika, üzeri kızarana kadar pişirin.'
),
(
  'Tereyağlı Pilav',
  'tereyagli-pilav',
  'side',
  '2 su bardağı baldo pirinç
3 su bardağı su veya tavuk suyu
2 yemek kaşığı tereyağı
1 çay kaşığı tuz',
  '1. Pirinci yıkayıp 30 dakika suda bekletin, süzün.
2. Tencerede tereyağını eritin.
3. Pirinci ekleyip 2-3 dakika kavurun.
4. Sıcak suyu ve tuzu ekleyin.
5. Kaynayınca kısık ateşte kapağı kapalı 18 dakika pişirin.
6. Ocağı kapatıp 10 dakika demlenmeye bırakın.'
),
(
  'Sütlaç',
  'sutlac',
  'dessert',
  '1 litre süt
4 yemek kaşığı pirinç unu
5 yemek kaşığı şeker
1 çay kaşığı vanilya
İsteğe bağlı: tarçın',
  '1. Pirinç ununu 1 su bardağı soğuk sütle pürüzsüz olana kadar çırpın.
2. Kalan sütü tencereye alıp ısıtın.
3. Pirinç unu karışımını, şekeri ve vanilyayı ekleyin.
4. Sürekli karıştırarak orta ateşte koyulaşana kadar pişirin (10-12 dakika).
5. Kaplara paylaştırın, soğuyunca buzdolabına koyun.
6. Servis ederken üzerine tarçın serpin.'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert today's published menu
INSERT INTO menus (date, soup_id, main_id, side_id, dessert_id, status)
SELECT
  CURRENT_DATE,
  (SELECT id FROM recipes WHERE slug = 'mercimek-corbasi'),
  (SELECT id FROM recipes WHERE slug = 'firin-tavuk'),
  (SELECT id FROM recipes WHERE slug = 'tereyagli-pilav'),
  (SELECT id FROM recipes WHERE slug = 'sutlac'),
  'published'
ON CONFLICT (date) DO NOTHING;
