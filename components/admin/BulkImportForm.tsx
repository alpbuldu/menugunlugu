"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = "soup" | "main" | "side" | "dessert";

// Türkçe → DB değeri eşlemesi (büyük/küçük harf fark etmez)
const CATEGORY_MAP: Record<string, Category> = {
  "çorba":           "soup",
  "corba":           "soup",
  "soup":            "soup",
  "ana yemek":       "main",
  "main":            "main",
  "yardımcı lezzet":    "side",
  "yardimci lezzet":    "side",
  "yardımcı lezzetler": "side",
  "yardimci lezzetler": "side",
  "eşlikçi":            "side",
  "eslikci":            "side",
  "yan yemek":          "side",
  "side":               "side",
  "tatlı":           "dessert",
  "tatli":           "dessert",
  "dessert":         "dessert",
};

const CATEGORY_LABELS: Record<Category, string> = {
  soup:    "Çorba",
  main:    "Ana Yemek",
  side:    "Yardımcı Lezzet",
  dessert: "Tatlı",
};

const CATEGORY_COLORS: Record<Category, string> = {
  soup:    "bg-blue-100 text-blue-700",
  main:    "bg-brand-100 text-brand-700",
  side:    "bg-green-100 text-green-700",
  dessert: "bg-pink-100 text-pink-700",
};

interface ParsedRecipe {
  title:        string;
  ingredients:  string;
  instructions: string;
  category:     Category | null;
  valid:        boolean;
  error:        string;
}

function parseCategory(raw: string): Category | null {
  const key = raw.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? null;
}

/**
 * Excel'den kopyalanan TSV verisini parse eder.
 * Hücre içi satır sonlarını (Alt+Enter) ve tırnaklı hücreleri doğru işler.
 */
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
      if (ch === '"' && next === '"') {
        // Escaped quote ""
        cell += '"';
        i += 2;
      } else if (ch === '"') {
        // End of quoted cell
        inQuotes = false;
        i++;
      } else {
        cell += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === "\t") {
        row.push(cell);
        cell = "";
        i++;
      } else if (ch === "\r" && next === "\n") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
        i += 2;
      } else if (ch === "\n" || ch === "\r") {
        row.push(cell);
        cell = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        cell += ch;
        i++;
      }
    }
  }

  // Son hücre ve satır
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);

  return rows;
}

function parseInput(raw: string): ParsedRecipe[] {
  const rows = parseTSV(raw).filter((r) => r.some((c) => c.trim()));
  return rows.map((cols) => {
    const title        = cols[0]?.trim() ?? "";
    const ingredients  = cols[1]?.trim() ?? "";
    const instructions = cols[2]?.trim() ?? "";
    const categoryRaw  = cols[3]?.trim() ?? "";
    const category     = parseCategory(categoryRaw);

    const errors: string[] = [];
    if (!title)         errors.push("tarif adı eksik");
    if (!ingredients)   errors.push("malzemeler eksik");
    if (!instructions)  errors.push("yapılış eksik");
    if (!categoryRaw)   errors.push("kategori eksik");
    else if (!category) errors.push(`"${categoryRaw}" tanımsız kategori`);

    return {
      title,
      ingredients,
      instructions,
      category,
      valid: errors.length === 0,
      error: errors.join(", "),
    };
  });
}

export default function BulkImportForm() {
  const router = useRouter();

  const [raw,       setRaw]       = useState("");
  const [parsed,    setParsed]    = useState<ParsedRecipe[]>([]);
  const [previewed, setPreviewed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState<{ imported: number } | null>(null);
  const [error,     setError]     = useState("");

  function handlePreview() {
    setParsed(parseInput(raw));
    setPreviewed(true);
    setResult(null);
    setError("");
  }

  function handleClear() {
    setRaw("");
    setParsed([]);
    setPreviewed(false);
    setResult(null);
    setError("");
  }

  async function handleImport() {
    const validRows = parsed.filter((r) => r.valid);
    if (validRows.length === 0) return;

    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/recipes/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ recipes: validRows }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Hata oluştu"); return; }
      setResult(json);
      setRaw("");
      setParsed([]);
      setPreviewed(false);
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
          <li>Excel'de <strong>4 kolon</strong> hazırla (başlık satırı olmadan):</li>
        </ol>
        <div className="overflow-x-auto">
          <table className="text-xs border border-brand-200 rounded-xl overflow-hidden w-full">
            <thead className="bg-brand-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">A — Tarif Adı</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">B — Malzemeler</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">C — Yapılış</th>
                <th className="px-3 py-2 text-left font-semibold text-warm-700">D — Kategori</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-brand-100">
              <tr>
                <td className="px-3 py-2 text-warm-600">Mercimek Çorbası</td>
                <td className="px-3 py-2 text-warm-600">Mercimek, soğan…</td>
                <td className="px-3 py-2 text-warm-600">Mercimeği yıkayın…</td>
                <td className="px-3 py-2 font-medium text-warm-700">Çorba</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-warm-600">Izgara Köfte</td>
                <td className="px-3 py-2 text-warm-600">Kıyma, soğan…</td>
                <td className="px-3 py-2 text-warm-600">Kıymayı yoğurun…</td>
                <td className="px-3 py-2 font-medium text-warm-700">Ana Yemek</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-warm-500">
          Geçerli kategori değerleri:{" "}
          {(["Çorba", "Ana Yemek", "Yardımcı Lezzet", "Tatlı"] as const).map((c, i) => (
            <span key={c}>
              <code className="bg-white px-1.5 py-0.5 rounded border border-brand-200 text-xs">{c}</code>
              {i < 3 ? " · " : ""}
            </span>
          ))}
        </p>
        <ol className="list-decimal list-inside space-y-1 text-warm-600" start={2}>
          <li>Hücreleri seç (başlık hariç) → <strong>Ctrl+C</strong></li>
          <li>Aşağıya <strong>Ctrl+V</strong> ile yapıştır → <strong>Önizle</strong> → <strong>İçe Aktar</strong></li>
        </ol>
      </div>

      {/* Başarı */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-sm text-green-800 font-medium">
          ✅ {result.imported} tarif başarıyla içe aktarıldı.
        </div>
      )}

      {/* Yapıştırma alanı */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Excel'den yapıştır
        </label>
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setPreviewed(false); }}
          rows={10}
          placeholder={"Mercimek Çorbası\tMercimek, soğan, havuç\tMercimeği yıkayın…\tÇorba\nIzgara Köfte\tKıyma, soğan\tKıymayı yoğurun…\tAna Yemek"}
          className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <p className="text-xs text-warm-400 mt-1">
          Excel'den yapıştırınca kolonlar arası Tab otomatik gelir.
        </p>
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
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[150px]">Tarif Adı</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[180px]">Malzemeler</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[180px]">Yapılış</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 w-28">Kategori</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 w-24">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-white">
                  {parsed.map((row, i) => (
                    <tr key={i} className={row.valid ? "" : "bg-red-50"}>
                      <td className="px-4 py-3 text-warm-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-warm-800">
                        {row.title || <span className="text-red-400 italic text-xs">boş</span>}
                      </td>
                      <td className="px-4 py-3 text-warm-500 max-w-[180px]">
                        <span className="line-clamp-2 text-xs">
                          {row.ingredients || <span className="text-red-400 italic">boş</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-warm-500 max-w-[180px]">
                        <span className="line-clamp-2 text-xs">
                          {row.instructions || <span className="text-red-400 italic">boş</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.category ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[row.category]}`}>
                            {CATEGORY_LABELS[row.category]}
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs italic">?</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.valid ? (
                          <span className="text-green-600 text-xs font-medium">✓ Tamam</span>
                        ) : (
                          <span className="text-red-400 text-xs">{row.error}</span>
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
              {importing ? "İçe aktarılıyor…" : `${validCount} Tarifi İçe Aktar`}
            </button>
          )}
        </div>
      )}

      {previewed && parsed.length === 0 && (
        <p className="text-sm text-warm-400">Satır bulunamadı. Yapıştırdığın veriyi kontrol et.</p>
      )}
    </div>
  );
}
