import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/* ── Temel malzemeler — tarif satırlarında sayılmaz ─────────────
   PANTRY: herkeste var, eşleşmede hiç kullanılmaz (tuz, su, şeker…)
   STARRING_PANTRY: pantry ama tarif yıldızı olabilir (un, bal, maya…)
   Kullanıcı STARRING_PANTRY yazdıysa eşleştir; PANTRY yazdıysa atla. ── */
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

/* Kullanıcı bunları yazdıysa eşleştirmeye dahil et —
   tarif yıldızı olabilirler (un helvası, ballı kek, mayalı hamur…) */
const STARRING_PANTRY = new Set([
  "un", "buğday unu", "mısır unu",
  "nişasta", "mısır nişastası",
  "tereyağı",
  "bal",
  "maya", "instant maya",
  "zeytinyağı",
  "soda", "maden suyu",
  "limon suyu",
  "kabartma tozu", "karbonat",
  "pudra şekeri",
]);

/* ── Bölüm başlığı kökleri ─────────────────────────────────────── */
const _HDR_STEMS = [
  "servis", "sunum", "garnitür", "üzeri?", "sos", "hamur",
  "iç\\s+harç", "iç\\s+harc", "harç", "harc", "iç",
  "kaplama", "marine", "terbiye", "şurup", "şerbet", "krema",
  "dolgu", "süsleme", "beşamel", "tatlandırma", "tatlandırmak",
];
const SECTION_HEADER_RE = new RegExp(
  `^(${_HDR_STEMS.join("|")})[a-zçğışöü]*(?:\\s+için)?:?$`
);

/* ── Tanımlayıcı sıfat/ek — malzeme adından önce gelen kelimeler ──
   Örn: "pilavlık bulgur" → "bulgur"
        "rendelenmiş havuç" → "havuç"
        "taze soğan" → "soğan"                                    ── */
const DESCRIPTOR_RE = /\b(pilavlık|çorbalık|köftelik|kızartmalık|kıymalık|sotelik|ince|kaba|taze|kuru|konserve|salamura|dondurulmuş|pişmiş|çiğ|fileto|rendelenmiş?|kıyılmış?|doğranmış?|haşlanmış?|ezilmiş?|soyulmuş?|dilimlenmiş?|çekilmiş?|dövülmüş?|kavrulmuş?|közlenmiş?|fırınlanmış?)\b/gi;

/* ── HTML'den malzeme satırlarını çıkar ─────────────────────────── */
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
        // Miktar + birim kaldır
        .replace(/\d+[\d,.]*\s*(kg|gr|g\b|ml|lt|litre|adet|demet|diş|baş|çay kaşığı|yemek kaşığı|su bardağı|bardak|tutam|dal|dilim|paket|kutu|kaşık|tane|ölçü|avuç)/gi, "")
        .replace(/\d+/g, "")
        .replace(/[()[\]]/g, " ")
        // Tanımlayıcı sıfatları kaldır ("pilavlık bulgur" → "bulgur")
        .replace(DESCRIPTOR_RE, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(line =>
      line.length > 1 &&
      !line.endsWith(":") &&
      !line.endsWith(" için") &&
      !SECTION_HEADER_RE.test(line)
    );
}

/* ── Kullanıcı malzemesi → tarif satırı eşleşmesi ────────────── */
function matchesLine(userIng: string, recipeLine: string): boolean {
  const u = userIng.trim().toLowerCase();
  const r = recipeLine.trim().toLowerCase();
  return r.includes(u) || u.includes(r);
}

function isPantryLine(line: string): boolean {
  return [...PANTRY].some(p => line === p || line.startsWith(p + " ") || line.endsWith(" " + p));
}

/* ── Skor: kaç kullanıcı malzemesi eşleşti + toplam malzeme sayısı ── */
function scoreRecipe(
  ingredientLines: string[],
  userIngs: string[],
): { score: number; matched: string[]; total: number } {
  const nonPantryLines = ingredientLines.filter(l => !isPantryLine(l));
  const matched: string[] = [];

  for (const ui of userIngs) {
    if (PANTRY.has(ui) && !STARRING_PANTRY.has(ui)) continue; // tuz, su, şeker → her zaman atla
    // STARRING_PANTRY (un, bal, maya…) veya normal malzeme → TÜM satırlarda ara
    const hits = ingredientLines.some(line => matchesLine(ui, line));
    if (hits) matched.push(ui);
  }

  return { score: matched.length, matched, total: nonPantryLines.length, allTotal: ingredientLines.length };
}

/* ── Kullanıcı stop-word'leri ─────────────────────────────────── */
const _STOP_STEMS = [
  "servis", "sunum", "garnitür", "üzer",
  "sos", "hamur", "harç", "harc",
  "kaplama", "marine", "terbiye",
  "şurup", "şerbet", "krema", "dolgu",
  "süsleme", "beşamel", "tatlandırma", "hazırlama", "pişirme",
];
const _STOP_EXACT = new Set(["için", "ile", "iç", "üzeri", "üzerine"]);

function isUserStopWord(s: string): boolean {
  if (_STOP_EXACT.has(s)) return true;
  for (const stem of _STOP_STEMS) {
    if (s === stem) return true;
    if (s.startsWith(stem) && s.length - stem.length > 0 && s.length - stem.length <= 4) return true;
  }
  return false;
}

/* ── POST /api/chatbot ─────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const userIngredients: string[] = (body.ingredients ?? [])
    .map((s: string) => s.toLowerCase().trim())
    .filter((s: string) => s.length > 1 && !isUserStopWord(s));

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

  // Eşleştirmeye dahil olan malzemeler: pantry dışı + starring pantry
  const effectiveUserIngs = userIngredients.filter(u => !PANTRY.has(u) || STARRING_PANTRY.has(u));
  const targetScore = effectiveUserIngs.length;

  const suggestions = CATEGORIES.map(cat => {
    const excluded = new Set(excludeIds[cat] ?? []);

    // Tüm tarifler için skor + toplam malzeme sayısı hesapla
    const scored = recipes
      .filter(r => r.category === cat && !excluded.has(r.id))
      .map(r => {
        const lines = extractIngredientLines(r.ingredients ?? "");
        const { score, matched, total, allTotal } = scoreRecipe(lines, userIngredients);
        // Oran: eşleşen/toplam — ne kadar yüksekse malzeme o tarifte o kadar "belirleyici"
        // total=0 → tüm tarif malzemeleri pantry (un helvası gibi) → eşleşme varsa ratio=1
        const ratio = total > 0 ? score / total : score > 0 ? 1 : 0;
        return { id: r.id, title: r.title, slug: r.slug, score, matched, total, allTotal, ratio };
      });

    // Step-down: hedef skor'dan başla, 1'e kadar in
    // Her seviyede ratio'ya göre sırala (yüksek ratio = az malzemeli, daha sade tarif)
    let best: typeof scored[number] | null = null;
    const maxTry = Math.max(targetScore, 1);
    for (let s = maxTry; s >= 1; s--) {
      const atLevel = scored
        .filter(r => r.score === s)
        .sort((a, b) =>
          b.ratio - a.ratio ||           // ratio yüksek önce
          a.total - b.total ||           // eşit ratio'da az non-pantry malzeme önce
          a.allTotal - b.allTotal ||     // pantry dahil toplam — az malzemeli önce (un helvası gibi)
          Math.random() - 0.5            // son kalan rastgelelik
        );
      if (atLevel.length > 0) {
        best = atLevel[0];
        break;
      }
    }

    return {
      category:           cat,
      categoryTr:         CAT_TR[cat],
      recipe:             best ? { id: best.id, title: best.title, slug: best.slug } : null,
      matchedCount:       best?.score ?? 0,
      matchedIngredients: best?.matched ?? [],
      userIngCount:       targetScore,
      noMatch:            !best,
    };
  });

  return NextResponse.json({ suggestions });
}
