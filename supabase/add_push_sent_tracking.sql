-- Push gönderim takibi için site_settings'e sütun ekle
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS last_push_sent_date date;
