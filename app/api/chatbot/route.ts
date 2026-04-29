import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/* ── Temel malzemeler — eşleşmede sayılmaz ───────────────────── */
const PANTRY = new Set([
  "tuz", "karabiber", "pul biber", "kuru nane", "nane", "fesleğen", "kuru fesleğen",
  "kırmızı biber", "toz biber", "kırmızı toz biber", "toz kırmızı biber",
  "zerdeçal", "kimyon", "köri", "tarçın", "kakule", "karanfil",
  "defne yaprağı", "defne", "maydanoz", "dereotu", "reyhan",
  "yağ", "zeytinyağı", "ayçiçek yağı", "sıvı yağ", "tereyağı", "margarin",
  "su", "et suyu", "tavuk suyu", "sebze suyu", "kemik suyu",
  "un", "nişasta", "mısır nişastası", "mısır unu", "buğday unu",
  "şeker", "toz şeker", "pudra şekeri", "bal",
  "sirke", "limon suyu", "elma sirkesi",
  "kabartma tozu", "karbonat", "maya", "instant maya",
  "tane karabiber", "beyaz biber", "hardal",
  "soda", "maden suyu",
]);

/* ── HTML'den malzeme satırlarını çıkar ─────────────────────── */
function extractIngredientLines(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .toLowerCase();

  return text
    .split("\n")
    .map(line =>
      line
        .replace(/\d+[\d,.]*\s*(kg|gr|g\b|ml|lt|litre|adet|demet|diş|baş|çay kaşığı|yemek kaşığı|su bardağı|bardak|tutam|dal|dilim|paket|kutu|kaşık|tane|ölçü|avuç)/gi, "")
        .replace(/\d+/g, "")
        .replace(/[()[\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(line => line.length > 1);
}

/* ── Kullanıcı malzemesi → tarif satırı eşleşmesi ────────────── */
function matchesLine(userIng: string, recipeLine: string): boolean {
  // Kullanıcı kelimesinin tamamı tarif satırında geçmeli (veya tam tersi)
  const u = userIng.trim().toLowerCase();
  const r = recipeLine.trim().toLowerCase();
  return r.includes(u) || u.includes(r);
}

function isPantryLine(line: string): boolean {
  return [...PANTRY].some(p => line === p || line.startsWith(p + " ") || line.endsWith(" " + p));
}

/* ── Skora göre grupla: hangi user malzemeleri eşleşti ─────────── */
function scoreRecipe(
  ingredientLines: string[],
  userIngs: string[],
): { score: number; matched: string[] } {
  const nonPantryLines = ingredientLines.filter(l => !isPantryLine(l));
  const matched: string[] = [];

  for (const ui of userIngs) {
    if (PANTRY.has(ui)) continue; // kullanıcı baharat yazmışsa atla
    const hits = nonPantryLines.some(line => matchesLine(ui, line));
    if (hits) matched.push(ui);
  }

  return { score: matched.length, matched };
}

/* ── POST /api/chatbot ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const userIngredients: string[] = (body.ingredients ?? [])
    .map((s: string) => s.toLowerCase().trim())
    .filter(Boolean);

  const excludeIds: Record<string, string[]> = body.excludeIds ?? {};
  const onlyCategory: string | null = body.category ?? null;

  if (userIngredients.length === 0) {
    return NextResponse.json({ error: "En az 1 malzeme gerekli" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, title, slug, category, ingredients")
    .not("ingredients", "is", null);

  if (error || !recipes?.length) {
    return NextResponse.json({ error: "Tarifler yüklenemedi" }, { status: 500 });
  }

  const ALL_CATEGORIES = ["soup", "main", "side", "dessert"] as const;
  const CATEGORIES = onlyCategory
    ? ALL_CATEGORIES.filter(c => c === onlyCategory)
    : ALL_CATEGORIES;

  const CAT_TR: Record<string, string> = {
    soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
  };

  const suggestions = CATEGORIES.map(cat => {
    const excluded = new Set(excludeIds[cat] ?? []);

    // Tüm tarifler için skor hesapla
    const scored = recipes
      .filter(r => r.category === cat && !excluded.has(r.id))
      .map(r => {
        const lines   = extractIngredientLines(r.ingredients ?? "");
        const { score, matched } = scoreRecipe(lines, userIngredients);
        return { id: r.id, title: r.title, slug: r.slug, score, matched };
      })
      .sort((a, b) => b.score - a.score || Math.random() - 0.5);

    // Sadece en az 1 eşleşmesi olanı öner
    const best = scored.find(r => r.score > 0) ?? null;

    return {
      category:          cat,
      categoryTr:        CAT_TR[cat],
      recipe:            best ? { id: best.id, title: best.title, slug: best.slug } : null,
      matchedCount:      best?.score ?? 0,
      matchedIngredients: best?.matched ?? [],
      userIngCount:      userIngredients.filter(u => !PANTRY.has(u)).length,
      noMatch:           !best,
    };
  });

  return NextResponse.json({ suggestions });
}
