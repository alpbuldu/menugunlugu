/**
 * Menü Günlüğü — Tarif Analiz Scripti
 *
 * Kullanım:
 *   ANTHROPIC_API_KEY=sk-... node analyze.mjs
 *
 * Çıktı: recipe-analysis.json
 */

import Anthropic from "./node_modules/@anthropic-ai/sdk/index.mjs";
import fs from "fs";

// ─── Yapılandırma ─────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://sgisjvvfhwzvhtumrrnk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXNqdnZmaHd6dmh0dW1ycm5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzMDcxMSwiZXhwIjoyMDkwODA2NzExfQ.WMnBMmW7uZaxauH2sMaJlyC4ZNMVAaunm664zv53DaU";

const BATCH_SIZE   = 8;   // kaç tarif per API çağrısı
const PAUSE_MS     = 600; // batch arası bekleme (rate-limit)

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error("HATA: ANTHROPIC_API_KEY ortam değişkeni eksik.");
  console.error("Kullanım: ANTHROPIC_API_KEY=sk-... node analyze.mjs");
  process.exit(1);
}

const ai = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── Supabase'den tüm tarifleri çek ──────────────────────────────────────────
async function fetchAllRecipes() {
  const all = [];
  let from = 0;
  const PAGE = 200;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/recipes?select=id,title,servings,ingredients,instructions&order=id&limit=${PAGE}&offset=${from}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
    const data = await res.json();
    if (!data.length) break;
    all.push(...data);
    from += PAGE;
    if (data.length < PAGE) break;
  }
  return all;
}

// ─── HTML → düz metin ────────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<\/?(li|p|br)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Tek batch analizi ────────────────────────────────────────────────────────
async function analyzeBatch(recipes) {
  const texts = recipes
    .map((r, j) => {
      const servings = r.servings ?? 4;
      return `### TARİF ${j + 1}: ${r.title} (${servings} kişilik)
MALZEMELER:
${stripHtml(r.ingredients).slice(0, 800)}

YAPILIŞI (özet):
${(r.instructions ?? "").replace(/\n{2,}/g, "\n").slice(0, 700)}`;
    })
    .join("\n\n---\n\n");

  const msg = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Sen Türk mutfağı uzmanı bir diyetisyensin. Aşağıdaki tarifleri analiz et.

Her tarif için:
- kcal_per_person: 1 kişilik kalori (tarifin belirtilen porsiyonunu bölerek hesapla)
- prep_min: malzeme hazırlama süresi (dakika) — doğrama, ölçme vs.
- cook_min: pişirme süresi (dakika) — ocak/fırın/ızgara süresi

Kurallar:
- Sadece JSON döndür, açıklama ekleme
- Kesirli sayı kullanma, tam sayı ver
- Eğer tarif içeriği yoksa makul bir tahmin yap

Format (TARİF sayısı kadar eleman):
[{"kcal":320,"prep":10,"cook":25},...]

${texts}`,
      },
    ],
  });

  const raw = msg.content[0].text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`JSON bulunamadı:\n${raw}`);
  return JSON.parse(match[0]);
}

// ─── Ana akış ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("📥 Tarifler Supabase'den yükleniyor…");
  const recipes = await fetchAllRecipes();
  console.log(`✅ ${recipes.length} tarif bulundu.\n`);

  // Daha önce yarım kalan analizi devam ettir
  const OUT = "recipe-analysis.json";
  let existing = {};
  if (fs.existsSync(OUT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      prev.forEach((r) => { existing[r.id] = r; });
      console.log(`⏩ ${Object.keys(existing).length} tarif zaten analiz edilmiş, atlanıyor.\n`);
    } catch {}
  }

  const todo = recipes.filter((r) => !existing[r.id]);
  console.log(`🔍 Analiz edilecek: ${todo.length} tarif`);
  console.log(`📦 Batch boyutu: ${BATCH_SIZE} | Tahmini API çağrısı: ${Math.ceil(todo.length / BATCH_SIZE)}\n`);

  const results = Object.values(existing);
  let errors = 0;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const progress = `[${i + 1}–${Math.min(i + BATCH_SIZE, todo.length)}/${todo.length}]`;
    process.stdout.write(`${progress} Analiz ediliyor… `);

    try {
      const parsed = await analyzeBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        const p = parsed[j] ?? {};
        results.push({
          id:              batch[j].id,
          title:           batch[j].title,
          servings:        batch[j].servings ?? 4,
          kcal_per_person: p.kcal ?? null,
          prep_min:        p.prep ?? null,
          cook_min:        p.cook ?? null,
          total_min:       p.prep && p.cook ? p.prep + p.cook : null,
        });
      }
      console.log("✓");
    } catch (err) {
      console.log(`✗ HATA: ${err.message}`);
      errors++;
      batch.forEach((r) =>
        results.push({
          id: r.id, title: r.title, servings: r.servings,
          kcal_per_person: null, prep_min: null, cook_min: null, total_min: null,
          error: err.message,
        })
      );
    }

    // Checkpoint — her 5 batch'te bir kaydet
    if ((i / BATCH_SIZE + 1) % 5 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
      process.stdout.write(`  💾 Kaydedildi (${results.length} tarif)\n`);
    }

    if (i + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));

  // ─── Özet ─────────────────────────────────────────────────────────────────
  const valid = results.filter((r) => r.kcal_per_person);
  const avgKcal = Math.round(valid.reduce((s, r) => s + r.kcal_per_person, 0) / valid.length);
  const avgPrep = Math.round(valid.reduce((s, r) => s + (r.prep_min ?? 0), 0) / valid.length);
  const avgCook = Math.round(valid.reduce((s, r) => s + (r.cook_min ?? 0), 0) / valid.length);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tamamlandı!
📄 Çıktı: ${OUT}

Toplam   : ${results.length} tarif
Başarılı : ${valid.length}
Hatalı   : ${errors} batch

Ortalama kalori   : ${avgKcal} kcal/kişi
Ortalama hazırlama: ${avgPrep} dk
Ortalama pişirme  : ${avgCook} dk
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((e) => { console.error(e); process.exit(1); });
