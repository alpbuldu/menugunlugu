import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import AutoPrint from "./AutoPrint";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

interface PdfRecipe {
  id: string;
  title: string;
  category: Category;
  image_url: string | null;
  ingredients: string;
  instructions: string;
  servings: number | null;
}

const SLOTS: { key: Category; label: string; emoji: string }[] = [
  { key: "soup",    label: "Çorba",          emoji: "🥣" },
  { key: "main",    label: "Ana Yemek",       emoji: "🍽️" },
  { key: "side",    label: "Yardımcı Lezzet", emoji: "🥗" },
  { key: "dessert", label: "Tatlı",           emoji: "🍮" },
];

/** Strip HTML tags, turning list/block elements into newlines first */
function parseHtmlLines(html: string): string[] {
  const cleaned = html
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  return cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
}

function parseIngredients(html: string): string[] {
  return parseHtmlLines(html).filter((l) => !l.endsWith(":"));
}

function parseInstructions(html: string): string[] {
  return parseHtmlLines(html);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default async function MenuPdfPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const ids = {
    soup:    params.soup    ?? "",
    main:    params.main    ?? "",
    side:    params.side    ?? "",
    dessert: params.dessert ?? "",
  };

  const allIds = Object.values(ids).filter(Boolean);
  if (allIds.length !== 4) {
    return (
      <div className="p-10 text-center text-warm-500">
        Geçersiz menü parametreleri.
      </div>
    );
  }

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("recipes")
    .select("id, title, category, image_url, ingredients, instructions, servings")
    .in("id", allIds);

  const byId: Record<string, PdfRecipe> = {};
  for (const r of rows ?? []) byId[r.id] = r as PdfRecipe;

  const recipes: Record<Category, PdfRecipe | null> = {
    soup:    byId[ids.soup]    ?? null,
    main:    byId[ids.main]    ?? null,
    side:    byId[ids.side]    ?? null,
    dessert: byId[ids.dessert] ?? null,
  };

  const today = formatDate(new Date());

  return (
    <>
      <AutoPrint />
      <PrintButton />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 15mm; size: A4; }
        .page-break { page-break-after: always; break-after: page; }
      `}</style>

      <div className="font-sans text-warm-900 bg-white">

        {/* ══════════════════════════════════════════════════════
            SAYFA 1 — KAPAK
        ══════════════════════════════════════════════════════ */}
        <div className="page-break" style={{ minHeight: "257mm" }}>
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white px-10 py-12">
            <p className="text-xs font-semibold opacity-75 uppercase tracking-widest mb-1">menugunlugu.com</p>
            <h1 className="text-4xl font-bold mb-2">Günün Menüsü</h1>
            <p className="text-base opacity-75">{today}</p>
          </div>

          {/* Meal list */}
          <div className="px-10 py-8 space-y-0">
            {SLOTS.map(({ key, label, emoji }) => {
              const r = recipes[key];
              return (
                <div key={key} className="flex items-center gap-4 py-5 border-b border-warm-100 last:border-0">
                  <span className="text-3xl w-10 text-center flex-shrink-0">{emoji}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-xl font-semibold text-warm-800">{r?.title ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-10 py-6 mt-auto border-t border-warm-100">
            <p className="text-xs text-warm-400 text-center">menugunlugu.com · Günün Menüsü PDF</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SAYFA 2 — KONSOLİDE ALIŞVERİŞ LİSTESİ
        ══════════════════════════════════════════════════════ */}
        <div className="page-break" style={{ minHeight: "257mm" }}>
          {/* Page header */}
          <div className="px-10 pt-10 pb-4 border-b-2 border-brand-500 mb-8">
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest mb-1">Menü Günlüğü</p>
            <h2 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
              <span>🛒</span> Alışveriş Listesi
            </h2>
            <p className="text-sm text-warm-400 mt-1">{today}</p>
          </div>

          <div className="px-10 space-y-7">
            {SLOTS.map(({ key, label, emoji }) => {
              const r = recipes[key];
              if (!r) return null;
              const items = parseIngredients(r.ingredients);
              if (!items.length) return null;
              return (
                <div key={key}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span>{emoji}</span>
                    <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider">{label}</h3>
                    <span className="text-xs text-warm-400">— {r.title}</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SAYFALAR 3-6 — HER TARİF
        ══════════════════════════════════════════════════════ */}
        {SLOTS.map(({ key, label, emoji }, slotIdx) => {
          const r = recipes[key];
          if (!r) return null;
          const ingredients = parseIngredients(r.ingredients);
          const steps = parseInstructions(r.instructions);
          const isLast = slotIdx === SLOTS.length - 1;

          return (
            <div
              key={key}
              className={isLast ? "" : "page-break"}
              style={{ minHeight: "257mm" }}
            >
              {/* Recipe header */}
              <div className="px-10 pt-10 pb-4 border-b-2 border-brand-500 mb-8">
                <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-widest mb-1">
                  {emoji} {label}
                </p>
                <h2 className="text-2xl font-bold text-warm-900">{r.title}</h2>
                {r.servings && (
                  <p className="text-xs text-warm-400 mt-1">{r.servings} kişilik</p>
                )}
              </div>

              <div className="px-10 grid grid-cols-5 gap-10">
                {/* Malzemeler */}
                <div className="col-span-2">
                  <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>📋</span> Malzemeler
                  </h3>
                  <ul className="space-y-2">
                    {ingredients.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-warm-700 leading-snug">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Yapılışı */}
                <div className="col-span-3">
                  <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>👨‍🍳</span> Yapılışı
                  </h3>
                  <ol className="space-y-3">
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-warm-700 leading-relaxed">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
