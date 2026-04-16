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
  submitted_by: string | null;
}

interface AuthorInfo {
  name: string;
  username: string;
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

  // Fetch recipes
  const { data: rows } = await supabase
    .from("recipes")
    .select("id, title, category, image_url, ingredients, instructions, servings, submitted_by")
    .in("id", allIds);

  const byId: Record<string, PdfRecipe> = {};
  for (const r of rows ?? []) byId[r.id] = r as PdfRecipe;

  const recipes: Record<Category, PdfRecipe | null> = {
    soup:    byId[ids.soup]    ?? null,
    main:    byId[ids.main]    ?? null,
    side:    byId[ids.side]    ?? null,
    dessert: byId[ids.dessert] ?? null,
  };

  // Fetch member authors
  const memberIds = [...new Set(
    Object.values(recipes)
      .filter((r) => r?.submitted_by)
      .map((r) => r!.submitted_by!)
  )];

  const profileMap: Record<string, AuthorInfo> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", memberIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = { name: p.username, username: p.username };
    }
  }

  // Fetch admin author
  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username")
    .single();

  const adminAuthor: AuthorInfo = {
    name: adminProfile?.username ?? "Menü Günlüğü",
    username: "__admin__",
  };

  function getAuthor(recipe: PdfRecipe): AuthorInfo {
    if (!recipe.submitted_by) return adminAuthor;
    return profileMap[recipe.submitted_by] ?? { name: "Bilinmeyen", username: "" };
  }

  // Build consolidated ingredient list
  const allIngredients: string[] = [];
  for (const { key } of SLOTS) {
    const r = recipes[key];
    if (r) allIngredients.push(...parseIngredients(r.ingredients));
  }

  const today = formatDate(new Date());

  return (
    <>
      <AutoPrint />
      <PrintButton />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          input[type="checkbox"] { width: 14px; height: 14px; }
        }
        @page { margin: 14mm 16mm; size: A4 portrait; }
        .page-break { page-break-after: always; break-after: page; }
      `}</style>

      <div className="font-sans text-warm-900 bg-white">

        {/* ══════════════════════════════════════════════════════
            SAYFA 1 — KAPAK
        ══════════════════════════════════════════════════════ */}
        <div className="page-break" style={{ minHeight: "257mm" }}>
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white px-10 py-12">
            <p className="text-[10px] font-semibold opacity-75 uppercase tracking-widest mb-1">menugunlugu.com</p>
            <h1 className="text-4xl font-bold mb-2">Günün Menüsü</h1>
            <p className="text-sm opacity-70">{today}</p>
          </div>

          {/* Meal list */}
          <div className="px-10 py-6">
            {SLOTS.map(({ key, label, emoji }) => {
              const r = recipes[key];
              const author = r ? getAuthor(r) : null;
              return (
                <div key={key} className="flex items-center gap-4 py-5 border-b border-warm-100 last:border-0">
                  <span className="text-2xl w-9 text-center flex-shrink-0">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-lg font-semibold text-warm-800">{r?.title ?? "—"}</p>
                    {author && (
                      <p className="text-[10px] text-warm-400 mt-0.5">
                        Yazar: {author.name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-10 py-5 border-t border-warm-100">
            <p className="text-xs text-warm-400 text-center">menugunlugu.com · Günün Menüsü PDF</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SAYFA 2 — KONSOLİDE ALIŞVERİŞ LİSTESİ
        ══════════════════════════════════════════════════════ */}
        <div className="page-break" style={{ minHeight: "257mm" }}>
          {/* Page header */}
          <div className="px-10 pt-10 pb-4 border-b-2 border-brand-500 mb-8">
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest mb-1">Menü Günlüğü</p>
            <h2 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
              <span>🛒</span> Alışveriş Listesi
            </h2>
            <p className="text-xs text-warm-400 mt-1">{today} · 4 öğün</p>
          </div>

          <div className="px-10">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {allIngredients.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-warm-700">
                  <input
                    type="checkbox"
                    className="flex-shrink-0 w-3.5 h-3.5 rounded border border-warm-400 accent-brand-600"
                    readOnly
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
          const author = getAuthor(r);
          const isLast = slotIdx === SLOTS.length - 1;

          return (
            <div
              key={key}
              className={isLast ? "" : "page-break"}
              style={{ minHeight: "257mm" }}
            >
              {/* Recipe header */}
              <div className="px-10 pt-10 pb-4 border-b-2 border-brand-500 mb-6">
                <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest mb-1">
                  {emoji} {label}
                </p>
                <h2 className="text-2xl font-bold text-warm-900 mb-1">{r.title}</h2>
                <div className="flex items-center gap-4 text-xs text-warm-400">
                  {r.servings && <span>{r.servings} kişilik</span>}
                  <span>
                    Yazar:{" "}
                    <span className="font-medium text-warm-600">{author.name}</span>
                    {author.username && author.username !== "__admin__" && (
                      <span className="ml-1 text-brand-500">menugunlugu.com/uye/{author.username}</span>
                    )}
                    {author.username === "__admin__" && (
                      <span className="ml-1 text-brand-500">menugunlugu.com</span>
                    )}
                  </span>
                </div>
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
