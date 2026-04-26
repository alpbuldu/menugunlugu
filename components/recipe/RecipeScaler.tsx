"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type IngItem = { type: "heading"; text: string } | { type: "item"; text: string };

// ─── HTML parser ──────────────────────────────────────────────────────────────

function parseHtmlIngredients(html: string): IngItem[] {
  const result: IngItem[] = [];
  const flat = html
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n__H__$1\n")
    .replace(/<\/?(ul|ol|div)[^>]*>/gi, "")
    .replace(/<(p|li)[^>]*>/gi, "\n")
    .replace(/<\/(p|li)>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  for (const raw of flat.split("\n")) {
    const line = raw.replace(/&nbsp;/g, "").trim();
    if (!line) continue;
    if (line.startsWith("__H__")) {
      const h = line.slice(5).trim();
      if (h) result.push({ type: "heading", text: h });
    } else {
      result.push({ type: "item", text: line });
    }
  }
  return result;
}

// ─── Sayılabilir malzemeler — kesirli çıkarsa yukarı yuvarla ─────────────────
// Sadece bölünemeyen/yarım kullanılamayan ürünler. Eklemek için söyleyin.
const COUNTABLE_WORDS = new Set([
  "yufka", "lavaş",
]);

function needsCeil(restText: string): boolean {
  const first = restText.trim().toLowerCase().split(/[\s,.(]/)[0];
  return COUNTABLE_WORDS.has(first);
}

function applyCountable(val: number, restText: string): number {
  if (!needsCeil(restText)) return val;
  const frac = val - Math.floor(val);
  if (frac < 0.01) return val; // zaten tam sayı
  return Math.ceil(val);
}

// ─── Amount formatter ─────────────────────────────────────────────────────────

function fmt(v: number): string {
  const r = Math.round(v * 100) / 100;

  // 0.75 → 1'e tamamla
  if (Math.abs(r - 0.75) < 0.01) return "1";

  const whole = Math.floor(r);
  const frac  = Math.round((r - whole) * 100) / 100;

  // Tam sayı
  if (frac < 0.01) return String(whole);

  // Saf kesirler için özel isimler
  if (whole === 0) {
    if (Math.abs(frac - 0.25) < 0.01) return "Çeyrek";
    if (Math.abs(frac - 0.5)  < 0.01) return "Yarım";
  }

  // Ondalık gösterim (1,5 / 2,25 …)
  return r.toFixed(2).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

// ─── Ingredient scaler ────────────────────────────────────────────────────────

function scaleIngredientRaw(text: string, scale: number): string {
  if (scale === 1) return text;
  const s = text.trim();

  // Aralık: "2-3 diş sarımsak"
  let m = s.match(/^(\d+(?:[,.]\d+)?)\s*-\s*(\d+(?:[,.]\d+)?)([\s\S]*)/);
  if (m) {
    const a = applyCountable(parseFloat(m[1].replace(",", ".")) * scale, m[3]);
    const b = applyCountable(parseFloat(m[2].replace(",", ".")) * scale, m[3]);
    return `${fmt(a)}-${fmt(b)}${m[3]}`;
  }

  // "yarım çay bardağı"
  m = s.match(/^yarım\s+([\s\S]+)/i);
  if (m) {
    const val = applyCountable(0.5 * scale, m[1]);
    return `${fmt(val)} ${m[1]}`;
  }

  // "çeyrek su bardağı"
  m = s.match(/^çeyrek\s+([\s\S]+)/i);
  if (m) {
    const val = applyCountable(0.25 * scale, m[1]);
    return `${fmt(val)} ${m[1]}`;
  }

  // "1 buçuk su bardağı" = 1.5
  m = s.match(/^(\d+)\s+buçuk\s+([\s\S]+)/i);
  if (m) {
    const val = applyCountable((parseInt(m[1]) + 0.5) * scale, m[2]);
    return `${fmt(val)} ${m[2]}`;
  }

  // Bileşik kesir: "1 1/2 su bardağı"
  m = s.match(/^(\d+)\s+(\d+)\/(\d+)\s+([\s\S]+)/);
  if (m) {
    const raw = parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
    const val = applyCountable(raw * scale, m[4]);
    return `${fmt(val)} ${m[4]}`;
  }

  // Kesir: "1/2 çay bardağı"
  m = s.match(/^(\d+)\/(\d+)\s+([\s\S]+)/);
  if (m) {
    const raw = parseInt(m[1]) / parseInt(m[2]);
    const val = applyCountable(raw * scale, m[3]);
    return `${fmt(val)} ${m[3]}`;
  }

  // Ondalık: "1,5 kg et"
  m = s.match(/^(\d+[,.]\d+)\s+([\s\S]+)/);
  if (m) {
    const raw = parseFloat(m[1].replace(",", "."));
    const val = applyCountable(raw * scale, m[2]);
    return `${fmt(val)} ${m[2]}`;
  }

  // Tam sayı + birim: "2 su bardağı un"
  m = s.match(/^(\d+)\s+([\s\S]+)/);
  if (m) {
    const val = applyCountable(parseInt(m[1]) * scale, m[2]);
    return `${fmt(val)} ${m[2]}`;
  }

  // Sadece sayı: "3"
  m = s.match(/^(\d+)$/);
  if (m) return fmt(parseInt(m[1]) * scale);

  // Miktar yok → olduğu gibi bırak
  return text;
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function scaleIngredient(text: string, scale: number): string {
  const result = scaleIngredientRaw(text, scale);
  if (result !== text && /^[a-zA-ZğüşıöçĞÜŞİÖÇ]/u.test(result)) {
    return capitalizeFirst(result);
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  ingredientsRaw: string;
  isHtml: boolean;
  servings: number | null;
}

// Kişi sayısı belli değilse kullanılan çarpan seçenekleri
const SCALE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.25, label: "Çeyrek" },
  { value: 0.5,  label: "Yarım" },
  { value: 1,    label: "1×" },
  { value: 2,    label: "2×" },
  { value: 4,    label: "4×" },
  { value: 8,    label: "8×" },
];

// Desteklenen porsiyon seçenekleri
const SERVINGS_OPTIONS = [2, 4, 8];

function closestServings(n: number): number {
  return SERVINGS_OPTIONS.reduce((best, s) =>
    Math.abs(s - n) < Math.abs(best - n) ? s : best,
    SERVINGS_OPTIONS[0]
  );
}

export default function RecipeScaler({ ingredientsRaw, isHtml, servings }: Props) {
  const original = servings ?? null;
  const initCurrent = original ? closestServings(original) : 4;

  const [current,    setCurrent]    = useState(initCurrent);
  const [scaleMulti, setScaleMulti] = useState(1);

  const scale = original ? current / original : scaleMulti;

  const items: IngItem[] = useMemo(() => {
    if (isHtml) return parseHtmlIngredients(ingredientsRaw);
    return ingredientsRaw
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ type: "item" as const, text }));
  }, [ingredientsRaw, isHtml]);

  const scaledItems = useMemo(
    () => items.map((item) =>
      item.type === "heading"
        ? item
        : { ...item, text: scaleIngredient(item.text, scale) }
    ),
    [items, scale]
  );

  return (
    <div>
      {/* Porsiyon kontrolü */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-warm-500 font-medium shrink-0">Porsiyon:</span>

        {original ? (
          // Kişi sayısı belli → 2 / 4 / 8 butonları
          <div className="flex items-center gap-1.5">
            {SERVINGS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setCurrent(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  current === s
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {s} kişi
              </button>
            ))}
          </div>
        ) : (
          // Kişi sayısı yok → sabit çarpanlar
          <div className="flex items-center gap-1.5 flex-wrap">
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScaleMulti(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  scaleMulti === opt.value
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {scale !== 1 && (
          <span className="text-[11px] text-brand-500 font-medium">
            {original
              ? `${current} kişilik`
              : SCALE_OPTIONS.find(o => o.value === scaleMulti)?.label ?? `${scaleMulti}×`
            } ölçek
          </span>
        )}
      </div>

      {/* Malzeme listesi */}
      <div className="bg-warm-50 rounded-xl p-5 space-y-1">
        {scaledItems.map((item, i) =>
          item.type === "heading" ? (
            <h3 key={i} className="text-sm font-bold text-warm-800 border-b border-warm-200 pb-1 mt-4 mb-0 first:mt-0">
              {item.text}
            </h3>
          ) : (
            <div key={i} className="flex items-start gap-2.5 text-warm-700 text-sm py-0.5">
              <span className="text-brand-400 mt-0.5 shrink-0">•</span>
              <span>{item.text}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
