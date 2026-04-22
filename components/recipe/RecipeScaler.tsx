"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type IngItem = { type: "heading"; text: string } | { type: "item"; text: string };

// ─── HTML parser (same logic as server-side) ──────────────────────────────────

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

// ─── Amount formatter ─────────────────────────────────────────────────────────

function fmt(v: number): string {
  const r = Math.round(v * 100) / 100;
  if (Math.abs(r - 0.25) < 0.01) return "çeyrek";
  if (Math.abs(r - 0.5)  < 0.01) return "yarım";
  if (Math.abs(r - 0.75) < 0.01) return "3/4";
  const whole = Math.floor(r);
  const frac  = Math.round((r - whole) * 100) / 100;
  if (frac < 0.01) return String(whole);
  if (Math.abs(frac - 0.5)  < 0.01) return whole === 0 ? "yarım"   : `${whole},5`;
  if (Math.abs(frac - 0.25) < 0.01) return whole === 0 ? "çeyrek"  : `${whole} çeyrek`;
  if (Math.abs(frac - 0.75) < 0.01) return whole === 0 ? "3/4"     : `${whole} 3/4`;
  return r.toFixed(1).replace(".", ",");
}

// ─── Ingredient scaler ────────────────────────────────────────────────────────

function scaleIngredient(text: string, scale: number): string {
  if (scale === 1) return text;
  const s = text.trim();

  // Aralık: "2-3 diş sarımsak" → "4-6 diş sarımsak"
  let m = s.match(/^(\d+(?:[,.]\d+)?)\s*-\s*(\d+(?:[,.]\d+)?)([\s\S]*)/);
  if (m) {
    const a = parseFloat(m[1].replace(",", ".")) * scale;
    const b = parseFloat(m[2].replace(",", ".")) * scale;
    return `${fmt(a)}-${fmt(b)}${m[3]}`;
  }

  // "yarım çay bardağı" → "1 çay bardağı"
  m = s.match(/^yarım\s+([\s\S]+)/i);
  if (m) return `${fmt(0.5 * scale)} ${m[1]}`;

  // "çeyrek su bardağı"
  m = s.match(/^çeyrek\s+([\s\S]+)/i);
  if (m) return `${fmt(0.25 * scale)} ${m[1]}`;

  // "1 buçuk su bardağı" = 1.5
  m = s.match(/^(\d+)\s+buçuk\s+([\s\S]+)/i);
  if (m) return `${fmt((parseInt(m[1]) + 0.5) * scale)} ${m[2]}`;

  // Bileşik kesir: "1 1/2 su bardağı"
  m = s.match(/^(\d+)\s+(\d+)\/(\d+)\s+([\s\S]+)/);
  if (m) {
    const val = parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
    return `${fmt(val * scale)} ${m[4]}`;
  }

  // Kesir: "1/2 çay bardağı"
  m = s.match(/^(\d+)\/(\d+)\s+([\s\S]+)/);
  if (m) {
    const val = parseInt(m[1]) / parseInt(m[2]);
    return `${fmt(val * scale)} ${m[3]}`;
  }

  // Ondalık: "1,5 kg et" veya "1.5 kg"
  m = s.match(/^(\d+[,.]\d+)\s+([\s\S]+)/);
  if (m) {
    const val = parseFloat(m[1].replace(",", "."));
    return `${fmt(val * scale)} ${m[2]}`;
  }

  // Tam sayı + birim: "2 su bardağı un"
  m = s.match(/^(\d+)\s+([\s\S]+)/);
  if (m) return `${fmt(parseInt(m[1]) * scale)} ${m[2]}`;

  // Sadece sayı: "3"
  m = s.match(/^(\d+)$/);
  if (m) return fmt(parseInt(m[1]) * scale);

  // Miktar yok → olduğu gibi bırak (tuz, karabiber vs.)
  return text;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  ingredientsRaw: string;
  isHtml: boolean;
  servings: number | null;
}

// Sabit çarpan seçenekleri (kişi sayısı bilinmiyorsa)
const SCALE_OPTIONS = [1, 2, 3, 4];

export default function RecipeScaler({ ingredientsRaw, isHtml, servings }: Props) {
  const original = servings ?? null;
  const [current, setCurrent] = useState(original ?? 1);
  const [scaleMulti, setScaleMulti] = useState(1); // servings yoksa kullanılır

  const scale = original ? current / original : scaleMulti;

  const items: IngItem[] = isHtml
    ? parseHtmlIngredients(ingredientsRaw)
    : ingredientsRaw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ type: "item" as const, text }));

  return (
    <div>
      {/* Porsiyon kontrolü */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-warm-500 font-medium shrink-0">Porsiyon:</span>

        {original ? (
          // Kişi sayısı belli → arttır/azalt
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrent(Math.max(1, current - 1))}
              disabled={current <= 1}
              className="w-7 h-7 rounded-full border border-warm-200 bg-white text-warm-600 hover:border-brand-300 hover:text-brand-700 text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >−</button>
            <span className="min-w-[64px] text-center text-sm font-semibold text-warm-800">
              {current} kişi
            </span>
            <button
              onClick={() => setCurrent(Math.min(50, current + 1))}
              disabled={current >= 50}
              className="w-7 h-7 rounded-full border border-warm-200 bg-white text-warm-600 hover:border-brand-300 hover:text-brand-700 text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >+</button>
          </div>
        ) : (
          // Kişi sayısı yok → sabit çarpanlar
          <div className="flex items-center gap-1.5">
            {SCALE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setScaleMulti(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  scaleMulti === s
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}

        {scale !== 1 && (
          <span className="text-[11px] text-brand-500 font-medium">
            {Number.isInteger(scale) ? `${scale}×` : `${scale.toFixed(2).replace(/\.?0+$/, "")}×`} ölçek
          </span>
        )}
      </div>

      {/* Malzeme listesi */}
      <div className="bg-warm-50 rounded-xl p-5 space-y-1">
        {items.map((item, i) =>
          item.type === "heading" ? (
            <h3
              key={i}
              className="text-sm font-bold text-warm-800 border-b border-warm-200 pb-1 mt-4 mb-0 first:mt-0"
            >
              {item.text}
            </h3>
          ) : (
            <div key={i} className="flex items-start gap-2.5 text-warm-700 text-sm py-0.5">
              <span className="text-brand-400 mt-0.5 shrink-0">•</span>
              <span>{scaleIngredient(item.text, scale)}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
