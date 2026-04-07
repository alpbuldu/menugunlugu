"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Recipe {
  id: string;
  title: string;
  category: string;
}

interface ParsedMenu {
  date:         string | null;
  dateRaw:      string;
  soupTitle:    string;
  mainTitle:    string;
  sideTitle:    string;
  dessertTitle: string;
  soupId:       string | null;
  mainId:       string | null;
  sideId:       string | null;
  dessertId:    string | null;
  valid:        boolean;
  errors:       string[];
}

const CATEGORY_ORDER: Record<string, number> = { soup: 0, main: 1, side: 2, dessert: 3 };
const CATEGORY_LABELS: Record<string, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};
const CATEGORY_COLORS: Record<string, string> = {
  soup:    "bg-blue-100 text-blue-700",
  main:    "bg-brand-100 text-brand-700",
  side:    "bg-green-100 text-green-700",
  dessert: "bg-pink-100 text-pink-700",
};

// DD.MM.YYYY / DD/MM/YYYY / YYYY-MM-DD → YYYY-MM-DD
function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const day   = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    const year  = m[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
function formatDateTR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS_TR[parseInt(m) - 1]} ${y}`;
}

function parseTSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < raw.length) {
    const ch   = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i += 2; }
      else if (ch === '"') { inQuotes = false; i++; }
      else { cell += ch; i++; }
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === "\t") { row.push(cell); cell = ""; i++; }
      else if (ch === "\r" && next === "\n") {
        row.push(cell); cell = ""; rows.push(row); row = []; i += 2;
      } else if (ch === "\n" || ch === "\r") {
        row.push(cell); cell = ""; rows.push(row); row = []; i++;
      } else { cell += ch; i++; }
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

function buildLookup(recipes: Recipe[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of recipes) map.set(r.title.toLowerCase().trim(), r.id);
  return map;
}

function parseInput(raw: string, lookup: Map<string, string>): ParsedMenu[] {
  const rows = parseTSV(raw).filter((r) => r.some((c) => c.trim()));
  return rows.map((cols) => {
    const dateRaw      = cols[0]?.trim() ?? "";
    const soupTitle    = cols[1]?.trim() ?? "";
    const mainTitle    = cols[2]?.trim() ?? "";
    const sideTitle    = cols[3]?.trim() ?? "";
    const dessertTitle = cols[4]?.trim() ?? "";

    const date      = parseDate(dateRaw);
    const soupId    = soupTitle    ? lookup.get(soupTitle.toLowerCase())    ?? null : null;
    const mainId    = mainTitle    ? lookup.get(mainTitle.toLowerCase())    ?? null : null;
    const sideId    = sideTitle    ? lookup.get(sideTitle.toLowerCase())    ?? null : null;
    const dessertId = dessertTitle ? lookup.get(dessertTitle.toLowerCase()) ?? null : null;

    const errors: string[] = [];
    if (!dateRaw)          errors.push("tarih eksik");
    else if (!date)        errors.push(`"${dateRaw}" geçersiz tarih`);
    if (!soupTitle)        errors.push("çorba eksik");
    else if (!soupId)      errors.push(`"${soupTitle}" bulunamadı`);
    if (!mainTitle)        errors.push("ana yemek eksik");
    else if (!mainId)      errors.push(`"${mainTitle}" bulunamadı`);
    if (!sideTitle)        errors.push("yardımcı lezzet eksik");
    else if (!sideId)      errors.push(`"${sideTitle}" bulunamadı`);
    if (!dessertTitle)     errors.push("tatlı eksik");
    else if (!dessertId)   errors.push(`"${dessertTitle}" bulunamadı`);

    return { date, dateRaw, soupTitle, mainTitle, sideTitle, dessertTitle,
             soupId, mainId, sideId, dessertId, valid: errors.length === 0, errors };
  });
}

// ── Tarif listesi paneli ─────────────────────────────────────────
function RecipeListPanel({ recipes }: { recipes: Recipe[] }) {
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState<string | null>(null);
  const [search,  setSearch]  = useState("");

  const grouped = Object.entries(CATEGORY_ORDER)
    .sort((a, b) => a[1] - b[1])
    .map(([cat]) => ({
      cat,
      label: CATEGORY_LABELS[cat],
      color: CATEGORY_COLORS[cat],
      items: recipes
        .filter((r) => r.category === cat &&
          (search === "" || r.title.toLowerCase().includes(search.toLowerCase())))
        .sort((a, b) => a.title.localeCompare(b.title, "tr")),
    }))
    .filter((g) => g.items.length > 0);

  const handleCopy = useCallback((title: string) => {
    navigator.clipboard.writeText(title).then(() => {
      setCopied(title);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  return (
    <div className="border border-warm-200 rounded-2xl overflow-hidden">
      {/* Başlık / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-warm-50 hover:bg-warm-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-warm-800">
          📋 Sistemdeki Tarif Listesi
          <span className="ml-2 text-xs font-normal text-warm-400">({recipes.length} tarif)</span>
        </span>
        <span className="text-warm-400 text-xs">{open ? "▲ Gizle" : "▼ Göster"}</span>
      </button>

      {open && (
        <div className="p-5 space-y-5 bg-white">
          {/* Arama */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tarif ara…"
            className="w-full px-3 py-2 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
          />

          {grouped.length === 0 && (
            <p className="text-sm text-warm-400">Sonuç bulunamadı.</p>
          )}

          {grouped.map(({ cat, label, color, items }) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
                  {label}
                </span>
                <span className="text-xs text-warm-400">{items.length} tarif</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {items.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleCopy(r.title)}
                    title="Kopyala"
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-warm-700 hover:bg-warm-50 text-left group transition-colors"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="text-xs shrink-0 text-warm-300 group-hover:text-brand-500 transition-colors">
                      {copied === r.title ? "✓" : "kopyala"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────────
export default function BulkMenuImportForm() {
  const router = useRouter();

  const [recipes,   setRecipes]   = useState<Recipe[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [raw,       setRaw]       = useState("");
  const [parsed,    setParsed]    = useState<ParsedMenu[]>([]);
  const [previewed, setPreviewed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status,    setStatus]    = useState<"published" | "draft">("published");
  const [result,    setResult]    = useState<{ imported: number; skipped: number } | null>(null);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((j) => { setRecipes(j.recipes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const lookup = buildLookup(recipes);

  function handlePreview() {
    setParsed(parseInput(raw, lookup));
    setPreviewed(true);
    setResult(null);
    setError("");
  }

  function handleClear() {
    setRaw(""); setParsed([]); setPreviewed(false); setResult(null); setError("");
  }

  async function handleImport() {
    const validRows = parsed.filter((r) => r.valid);
    if (validRows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const body = validRows.map((r) => ({
        date: r.date, soup_id: r.soupId, main_id: r.mainId,
        side_id: r.sideId, dessert_id: r.dessertId,
      }));
      const res  = await fetch("/api/admin/menus/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menus: body, status }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Hata oluştu"); return; }
      setResult(json);
      setRaw(""); setParsed([]); setPreviewed(false);
      router.refresh();
    } catch {
      setError("Sunucu hatası");
    } finally {
      setImporting(false);
    }
  }

  const validCount   = parsed.filter((r) => r.valid).length;
  const invalidCount = parsed.filter((r) => !r.valid).length;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Talimatlar */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-sm text-warm-700 space-y-3">
        <p className="font-semibold text-warm-800">Nasıl kullanılır?</p>
        <ol className="list-decimal list-inside space-y-1 text-warm-600">
          <li>Excel&apos;de <strong>5 kolon</strong> hazırla (başlık satırı olmadan):</li>
        </ol>
        <div className="overflow-x-auto">
          <table className="text-xs border border-brand-200 rounded-xl overflow-hidden w-full">
            <thead className="bg-brand-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">A — Tarih</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">B — Çorba</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">C — Ana Yemek</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">D — Yardımcı Lezzet</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">E — Tatlı</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-100">
              <tr>
                <td className="px-3 py-2 text-warm-600">15.04.2025</td>
                <td className="px-3 py-2 text-warm-600">Mercimek Çorbası</td>
                <td className="px-3 py-2 text-warm-600">Izgara Köfte</td>
                <td className="px-3 py-2 text-warm-600">Zeytinyağlı Fasulye</td>
                <td className="px-3 py-2 text-warm-600">Sütlaç</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="text-warm-500 space-y-1 text-xs">
          <li>Tarih formatı: <code className="bg-white px-1.5 py-0.5 rounded border border-brand-200">15.04.2025</code>{" "}veya{" "}<code className="bg-white px-1.5 py-0.5 rounded border border-brand-200">2025-04-15</code></li>
          <li>Tarif adları sistemdekilerle <strong>birebir</strong> eşleşmeli — aşağıdaki listeden kopyalayabilirsin.</li>
          <li>Zaten menüsü olan tarihlerin satırları atlanır.</li>
        </ul>
        <ol className="list-decimal list-inside space-y-1 text-warm-600" start={2}>
          <li>Hücreleri seç (başlık hariç) → <strong>Ctrl+C</strong></li>
          <li>Aşağıya <strong>Ctrl+V</strong> ile yapıştır → <strong>Önizle</strong> → <strong>İçe Aktar</strong></li>
        </ol>
      </div>

      {/* Başarı */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-sm text-green-800 font-medium">
          ✅ {result.imported} menü başarıyla içe aktarıldı.
          {result.skipped > 0 && (
            <span className="text-green-600 font-normal ml-2">
              ({result.skipped} tarih zaten mevcuttu, atlandı.)
            </span>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-warm-400">Tarifler yükleniyor…</p>}

      {!loading && (
        <>
          {/* Tarif listesi paneli */}
          <RecipeListPanel recipes={recipes} />

          {/* Yapıştırma alanı */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Excel&apos;den yapıştır
            </label>
            <textarea
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setPreviewed(false); }}
              rows={10}
              placeholder={"15.04.2025\tMercimek Çorbası\tIzgara Köfte\tZeytinyağlı Fasulye\tSütlaç\n16.04.2025\tDomates Çorbası\tKuru Fasulye\tPilav\tKadayıf"}
              className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
            />
            <p className="text-xs text-warm-400 mt-1">
              Excel&apos;den yapıştırınca kolonlar arası Tab otomatik gelir.
            </p>
          </div>

          {/* Durum seçimi */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-warm-700">İçe aktarılacak durum:</span>
            <label className="flex items-center gap-2 text-sm text-warm-700 cursor-pointer">
              <input type="radio" name="status" value="published"
                checked={status === "published"} onChange={() => setStatus("published")}
                className="accent-brand-600" />
              Yayında
            </label>
            <label className="flex items-center gap-2 text-sm text-warm-700 cursor-pointer">
              <input type="radio" name="status" value="draft"
                checked={status === "draft"} onChange={() => setStatus("draft")}
                className="accent-brand-600" />
              Taslak
            </label>
          </div>

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!raw.trim()}
              className="px-6 py-2.5 bg-warm-800 text-white rounded-xl text-sm font-medium hover:bg-warm-900 disabled:opacity-40 transition-colors"
            >
              Önizle
            </button>
            {previewed && (
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-2.5 border border-warm-200 text-warm-600 rounded-xl text-sm hover:bg-warm-50 transition-colors"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Önizleme tablosu */}
          {previewed && parsed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-700 font-medium">✓ {validCount} geçerli</span>
                {invalidCount > 0 && (
                  <span className="text-red-500">✗ {invalidCount} hatalı (içe aktarılmayacak)</span>
                )}
              </div>

              <div className="border border-warm-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-warm-50 border-b border-warm-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 w-8">#</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 w-32">Tarih</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[130px]">Çorba</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[130px]">Ana Yemek</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[130px]">Yardımcı Lezzet</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[130px]">Tatlı</th>
                        <th className="text-left px-4 py-3 font-medium text-warm-600 w-28">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 bg-white">
                      {parsed.map((row, i) => (
                        <tr key={i} className={row.valid ? "" : "bg-red-50"}>
                          <td className="px-4 py-3 text-warm-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-warm-800 text-xs">
                            {row.date ? formatDateTR(row.date) : (
                              <span className="text-red-400 italic">{row.dateRaw || "boş"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs"><RecipeCell title={row.soupTitle}    matched={!!row.soupId} /></td>
                          <td className="px-4 py-3 text-xs"><RecipeCell title={row.mainTitle}    matched={!!row.mainId} /></td>
                          <td className="px-4 py-3 text-xs"><RecipeCell title={row.sideTitle}    matched={!!row.sideId} /></td>
                          <td className="px-4 py-3 text-xs"><RecipeCell title={row.dessertTitle} matched={!!row.dessertId} /></td>
                          <td className="px-4 py-3">
                            {row.valid ? (
                              <span className="text-green-600 text-xs font-medium">✓ Tamam</span>
                            ) : (
                              <span className="text-red-400 text-xs leading-snug">{row.errors.join(", ")}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {validCount > 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="px-8 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {importing ? "İçe aktarılıyor…" : `${validCount} Menüyü İçe Aktar`}
                </button>
              )}
            </div>
          )}

          {previewed && parsed.length === 0 && (
            <p className="text-sm text-warm-400">Satır bulunamadı. Yapıştırdığın veriyi kontrol et.</p>
          )}
        </>
      )}
    </div>
  );
}

function RecipeCell({ title, matched }: { title: string; matched: boolean }) {
  if (!title) return <span className="text-red-400 italic">boş</span>;
  if (matched) return <span className="text-warm-700">{title}</span>;
  return (
    <span className="text-red-500 font-medium">
      {title} <span className="text-red-400 font-normal">(bulunamadı)</span>
    </span>
  );
}
