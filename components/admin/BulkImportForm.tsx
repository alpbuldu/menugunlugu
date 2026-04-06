"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = "soup" | "main" | "side" | "dessert";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "soup",    label: "Çorba" },
  { value: "main",    label: "Ana Yemek" },
  { value: "side",    label: "Eşlikçi Lezzetler" },
  { value: "dessert", label: "Tatlı" },
];

interface ParsedRecipe {
  title:        string;
  ingredients:  string;
  instructions: string;
  valid:        boolean;
}

function parseInput(raw: string): ParsedRecipe[] {
  const lines = raw.split("\n").filter((l) => l.trim());
  return lines.map((line) => {
    // Excel'den kopyalanınca tab ile ayrılır
    const cols = line.split("\t");
    const title        = cols[0]?.trim() ?? "";
    const ingredients  = cols[1]?.trim() ?? "";
    const instructions = cols[2]?.trim() ?? "";
    return {
      title,
      ingredients,
      instructions,
      valid: !!(title && ingredients && instructions),
    };
  });
}

export default function BulkImportForm() {
  const router = useRouter();

  const [raw,       setRaw]       = useState("");
  const [category,  setCategory]  = useState<Category>("main");
  const [parsed,    setParsed]    = useState<ParsedRecipe[]>([]);
  const [previewed, setPreviewed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState<{ imported: number; total: number } | null>(null);
  const [error,     setError]     = useState("");

  function handlePreview() {
    const rows = parseInput(raw);
    setParsed(rows);
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
        body:    JSON.stringify({ recipes: validRows, category }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Hata oluştu");
        return;
      }
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
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-sm text-warm-700 space-y-2">
        <p className="font-semibold text-warm-800">Nasıl kullanılır?</p>
        <ol className="list-decimal list-inside space-y-1 text-warm-600">
          <li>Excel veya Google Sheets'te <strong>3 kolon</strong> hazırla: <code className="bg-white px-1 rounded">Tarif Adı</code> | <code className="bg-white px-1 rounded">Malzemeler</code> | <code className="bg-white px-1 rounded">Yapılış</code></li>
          <li>Başlık satırı hariç tüm hücreleri seç → <strong>Ctrl+C</strong></li>
          <li>Aşağıdaki alana <strong>Ctrl+V</strong> ile yapıştır</li>
          <li>Kategori seç → Önizle → İçe Aktar</li>
        </ol>
      </div>

      {/* Başarı mesajı */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-sm text-green-800">
          ✅ <strong>{result.imported}</strong> tarif başarıyla içe aktarıldı.
        </div>
      )}

      {/* Kategori */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Tüm tarifler için kategori
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="px-4 py-2.5 border border-warm-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Yapıştırma alanı */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">
          Excel'den yapıştır
        </label>
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setPreviewed(false); }}
          rows={10}
          placeholder={"Mercimek Çorbası\tMercimek, soğan, havuç...\tMercimeği yıkayın...\nDomates Çorbası\tDomates, soğan...\tDomatesle soğanı kavurun..."}
          className="w-full px-4 py-3 border border-warm-200 rounded-xl text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
        />
        <p className="text-xs text-warm-400 mt-1">
          Her satır bir tarif. Kolonlar arasında <strong>Tab</strong> olmalı (Excel'den direkt yapıştırınca otomatik olur).
        </p>
      </div>

      {/* Butonlar */}
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
              <span className="text-red-500">✗ {invalidCount} eksik/hatalı (içe aktarılmayacak)</span>
            )}
          </div>

          <div className="border border-warm-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-warm-50 border-b border-warm-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 w-8">#</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[160px]">Tarif Adı</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[200px]">Malzemeler</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 min-w-[200px]">Yapılış</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-600 w-20">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-white">
                  {parsed.map((row, i) => (
                    <tr key={i} className={row.valid ? "" : "bg-red-50"}>
                      <td className="px-4 py-3 text-warm-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-warm-800">
                        {row.title || <span className="text-red-400 italic">boş</span>}
                      </td>
                      <td className="px-4 py-3 text-warm-600 max-w-[200px]">
                        <span className="line-clamp-2">
                          {row.ingredients || <span className="text-red-400 italic">boş</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-warm-600 max-w-[200px]">
                        <span className="line-clamp-2">
                          {row.instructions || <span className="text-red-400 italic">boş</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.valid
                          ? <span className="text-green-600">✓</span>
                          : <span className="text-red-400">✗</span>
                        }
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
        <p className="text-sm text-warm-400">Hiç satır bulunamadı. Yapıştırdığın veriyi kontrol et.</p>
      )}
    </div>
  );
}
