-- site_settings tablosuna RLS ekle
-- Supabase Dashboard → SQL Editor'da çalıştır

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Herkese okuma izni (anon + authenticated)
-- Sitenin public sayfaları bu tabloyu okuyor
CREATE POLICY "site_settings_public_read"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Yazma işlemleri (INSERT/UPDATE/DELETE) yok — admin service_role key kullanıyor,
-- service_role RLS'yi bypass eder, ekstra policy gerekmez.
