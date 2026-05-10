-- Hero Slides tablosu
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id          serial PRIMARY KEY,
  slide_key   text UNIQUE,
  badge       text NOT NULL DEFAULT '',
  title       text,
  subtitle    text,
  cta_label   text NOT NULL DEFAULT '',
  cta_href    text,
  image_url   text,
  tint        text,
  gradient    text NOT NULL DEFAULT 'from-brand-700 to-warm-800',
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (aktif slide'lar)
CREATE POLICY "Public read active slides" ON public.hero_slides
  FOR SELECT USING (is_active = true);

-- Service role key tüm işlemleri yapabilir (RLS bypass)

-- Mevcut 5 slide'ı ekle
INSERT INTO public.hero_slides (slide_key, badge, title, subtitle, cta_label, cta_href, gradient, tint, sort_order)
VALUES
  ('gunun-menusu',   'Her Gün Yeni Bir Menü', 'Her Gün Yeni Bir Menü,\nHer Gün Yeni Lezzetler', 'Bugünün menüsünü keşfet, ilham al.', 'Günün Menüsünü Gör', '/gunun-menusu', 'from-brand-700 to-warm-800',     null,                  1),
  ('son-tarif',      'Yeni Tarif',             null,                                               'Taze bir tarif seni bekliyor.',      'Tarife Git',          null,             'from-warm-800 to-warm-600',       null,                  2),
  ('menu-onerileri', 'Topluluk',               'Menü Önerileri',                                   'Editör seçkisi ve kullanıcı paylaşımlarından ilham al.', 'Keşfet', '/menu-gunlugu', 'from-[#7C4A1E] to-[#C87941]', 'bg-[#7C4A1E]/60', 3),
  ('blog',           'Yeni Blog',              null,                                               'Mutfak rehberleri ve lezzet yazıları.', 'Yazıyı Oku',        null,             'from-[#2C4A3E] to-[#4A7C6A]',    null,                  4),
  ('oyna',           'Eğlence',                'Oyna & Keşfet',                                    'Yemek dünyasına özel mini oyunlar ve quizler.', 'Oyunlara Git', '/oyna', 'from-[#3D1F5C] to-[#7B3FA0]', 'bg-[#3D1F5C]/40',  5)
ON CONFLICT (slide_key) DO NOTHING;
