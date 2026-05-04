/**
 * Turkish-aware search utilities.
 *
 * Handles:
 *  - Character normalization: ı→i, ğ→g, ş→s, ç→c, ö→o, ü→u
 *  - Common inflectional suffix stripping (accusative, dative, genitive, plural…)
 *  - Final-consonant devoicing reversal: kebab→kebap, pirinc→pirinc (ç already→c)
 *
 * Usage:
 *   import { trMatch, trNorm } from "@/lib/turkishSearch";
 *
 *   // Client-side filter
 *   items.filter(item => trMatch(item.title, searchQuery))
 *
 *   // Normalized string for a Supabase ilike query
 *   const nq = trQueryStem(searchQuery);
 *   supabase.from("recipes").ilike("title", `%${nq}%`)
 */

// ── Character map ────────────────────────────────────────────────────────────
const CHAR_MAP: [RegExp, string][] = [
  [/[ıİ]/g, "i"],
  [/[ğĞ]/g, "g"],
  [/[şŞ]/g, "s"],
  [/[çÇ]/g, "c"],
  [/[öÖ]/g, "o"],
  [/[üÜ]/g, "u"],
];

/** Lowercase + Turkish special-char normalization (ı→i, ğ→g …) */
export function trNorm(s: string): string {
  let r = s.toLocaleLowerCase("tr");
  for (const [re, rep] of CHAR_MAP) r = r.replace(re, rep);
  return r;
}

// ── Suffix stripping ─────────────────────────────────────────────────────────
// Normalized (already lowercased + char-mapped) suffixes, longest first.
// We only strip when the remaining stem is ≥ 3 characters.
const SUFFIXES: string[] = [
  // possessive + case combos
  "ndan", "nden", "ndan",
  "ndan", "nden",
  // plural + case
  "larin", "lerin",
  "lardan", "lerden",
  "larda", "lerde",
  "lara", "lere",
  "lari", "leri",
  "lar", "ler",
  // genitive
  "nin", "nun",
  "in", "un",
  // ablative
  "dan", "den", "tan", "ten",
  // locative
  "da", "de", "ta", "te",
  // dative / buffer-consonant accusative
  "ydan", "yden",
  "ya", "ye",
  "yi", "yu",
  "na", "ne",
  "ni", "nu",
  // accusative (bare)
  "a", "e", "i", "u",
];

/** Reverse final-consonant devoicing: b→p, d→t (common in Turkish nouns) */
function devoice(stem: string): string {
  const last = stem[stem.length - 1];
  if (last === "b") return stem.slice(0, -1) + "p";
  if (last === "d") return stem.slice(0, -1) + "t";
  // "c" already covers "ç" after char-map; don't devoice g→k (too aggressive)
  return stem;
}

/** Strip one Turkish suffix from a normalized string and apply devoicing. */
function trStem(normalized: string): string {
  if (normalized.length < 4) return normalized;
  for (const sfx of SUFFIXES) {
    if (
      normalized.endsWith(sfx) &&
      normalized.length - sfx.length >= 3
    ) {
      return devoice(normalized.slice(0, -sfx.length));
    }
  }
  return normalized;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the normalized + stemmed form of a query string.
 * Use this to feed into a Supabase `.ilike()` call alongside the raw query.
 *
 * Example:
 *   "Kebabı"  → "kebap"
 *   "çorbalar" → "corba"
 *   "tatlıyı"  → "tatli"   (stem of "tatlı")
 */
export function trQueryStem(query: string): string {
  return trStem(trNorm(query));
}

/**
 * Returns true when `target` string matches `query` in a Turkish-aware way.
 * Tests both the raw normalized query and its stemmed form.
 *
 * Example:
 *   trMatch("Mercimek Çorbası", "çorbayı") → true
 *   trMatch("Fırın Kebap",      "kebabı")  → true
 */
export function trMatch(target: string, query: string): boolean {
  if (!query.trim()) return true;
  const nTarget = trNorm(target);
  const nQuery  = trNorm(query.trim());

  if (nTarget.includes(nQuery)) return true;

  const stem = trStem(nQuery);
  if (stem !== nQuery && nTarget.includes(stem)) return true;

  return false;
}
