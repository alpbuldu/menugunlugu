/**
 * Menü Günlüğü — Analiz Sonuçlarını DB'ye Uygula
 *
 * Önce analyze.mjs çalıştırılmalı → recipe-analysis.json oluşmalı.
 * Sonra bu scripti çalıştır:
 *   node apply.mjs
 *
 * DB'ye eklenecek kolonlar (önce SQL çalıştır):
 *   ALTER TABLE recipes ADD COLUMN IF NOT EXISTS kcal_per_person integer;
 *   ALTER TABLE recipes ADD COLUMN IF NOT EXISTS prep_time_minutes integer;
 *   ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cook_time_minutes integer;
 */

import fs from "fs";

const SUPABASE_URL = "https://sgisjvvfhwzvhtumrrnk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXNqdnZmaHd6dmh0dW1ycm5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzMDcxMSwiZXhwIjoyMDkwODA2NzExfQ.WMnBMmW7uZaxauH2sMaJlyC4ZNMVAaunm664zv53DaU";

const OUT = "recipe-analysis.json";
if (!fs.existsSync(OUT)) {
  console.error(`HATA: ${OUT} bulunamadı. Önce analyze.mjs çalıştırın.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
const valid = data.filter((r) => r.kcal_per_person != null && r.prep_min != null && r.cook_min != null);
console.log(`📊 Uygulanacak: ${valid.length}/${data.length} tarif\n`);

let ok = 0, fail = 0;

for (const r of valid) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recipes?id=eq.${r.id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        kcal_per_person:   r.kcal_per_person,
        prep_time_minutes: r.prep_min,
        cook_time_minutes: r.cook_min,
      }),
    }
  );

  if (res.ok) {
    ok++;
    process.stdout.write(ok % 20 === 0 ? `\n${ok}` : ".");
  } else {
    fail++;
    const err = await res.text();
    console.error(`\n✗ ${r.title}: ${err}`);
  }
}

console.log(`\n\n✅ Tamamlandı: ${ok} güncellendi, ${fail} hata.`);
