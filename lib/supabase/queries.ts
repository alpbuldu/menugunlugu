import { createClient } from "./server";
import type { MenuWithRecipes, Recipe, Category, BlogCategory, BlogPost } from "@/lib/types";

// All recipe columns including slug (used for standalone recipe queries)
const RECIPE_FIELDS = "id, title, slug, category, description, seo_title, seo_keywords, ingredients, instructions, image_url, servings, created_at, updated_at, submitted_by";

// For menu joins we include slug so recipe cards can link to the detail page
const MENU_WITH_RECIPES = `
  id, date, status, created_at,
  soup:soup_id(${RECIPE_FIELDS}),
  main:main_id(${RECIPE_FIELDS}),
  side:side_id(${RECIPE_FIELDS}),
  dessert:dessert_id(${RECIPE_FIELDS})
`.trim();

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.startsWith("https://") && !url.includes("your-project-id");
}

/**
 * Returns today's date as YYYY-MM-DD using the *local* timezone,
 * matching what Supabase stores via CURRENT_DATE on the same wall clock.
 * Using toISOString() would give UTC which can be a different calendar
 * day than the server/database when the offset is +/- hours.
 */
function localDateString(): string {
  // Force Istanbul timezone so Vercel (UTC) doesn't lag 3 hours behind Turkey
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** Fetch today's published menu with all 4 recipes joined */
export async function getTodayMenu(): Promise<MenuWithRecipes | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const today = localDateString();

    const { data, error } = await supabase
      .from("menus")
      .select(MENU_WITH_RECIPES)
      .eq("date", today)
      .eq("status", "published")
      .single();

    if (error) {
      console.error("[getTodayMenu] Supabase error:", error.message, "| date queried:", today);
      return null;
    }
    return data as unknown as MenuWithRecipes;
  } catch (err) {
    console.error("[getTodayMenu] Unexpected error:", err);
    return null;
  }
}

/** Fetch published menu for a specific date (YYYY-MM-DD) */
export async function getMenuByDate(date: string): Promise<MenuWithRecipes | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menus")
      .select(MENU_WITH_RECIPES)
      .eq("date", date)
      .eq("status", "published")
      .single();

    if (error || !data) return null;
    return data as unknown as MenuWithRecipes;
  } catch {
    return null;
  }
}

/** Fetch all recipes, optionally filtered by category */
export async function getRecipes(category?: Category): Promise<Recipe[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();

    let query = supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .or("approval_status.eq.approved,approval_status.is.null")
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Recipe[];
  } catch {
    return [];
  }
}

/**
 * Normalise a slug to ASCII-only so lookups survive any Turkish chars
 * that may still be in the URL (legacy slugs before the DB migration).
 */
function normaliseSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fetch a single recipe by slug */
export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  if (!isSupabaseConfigured()) return null;

  // Next.js may pass params.slug as a raw percent-encoded string — always decode first.
  const decodedSlug    = decodeURIComponent(slug);
  const normalisedSlug = normaliseSlug(decodedSlug);

  console.log("[getRecipeBySlug] decoded:", decodedSlug, "| normalised:", normalisedSlug);

  try {
    const supabase = await createClient();

    // 1. Try the normalised ASCII slug (works after fix_slugs_ascii.sql is run)
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .eq("slug", normalisedSlug)
      .maybeSingle();

    if (!error && data) return data as Recipe;

    if (error) {
      console.error("[getRecipeBySlug] ASCII query error:", error.message, "| slug:", normalisedSlug);
    }

    // 2. Fallback: try the decoded (possibly Turkish-char) slug for legacy DB entries
    const { data: fallback, error: fallbackError } = await supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .eq("slug", decodedSlug)
      .maybeSingle();

    if (fallbackError) {
      console.error("[getRecipeBySlug] decoded query error:", fallbackError.message, "| slug:", decodedSlug);
    }

    return (fallback as Recipe) ?? null;
  } catch (err) {
    console.error("[getRecipeBySlug] Unexpected error:", err);
    return null;
  }
}

/**
 * Returns all published menu dates (as YYYY-MM-DD strings) for a given month.
 * Used by the calendar archive to highlight days that have a menu.
 */
export async function getMenuDatesForMonth(
  year: number,
  month: number
): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("menus")
      .select("date")
      .gte("date", start)
      .lt("date", end)
      .eq("status", "published")
      .order("date");

    if (error || !data) return [];
    return data.map((row: { date: string }) => row.date);
  } catch {
    return [];
  }
}

/**
 * Returns `limit` recipes in a random order.
 * Fetches all recipes then shuffles in JS (PostgREST doesn't expose RANDOM() ordering).
 */
export async function getRandomRecipes(): Promise<Recipe[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .or("approval_status.eq.approved,approval_status.is.null");
    if (error || !data) return [];
    // Fisher-Yates shuffle — tüm listesi döndür, slider kendi döngüsünde yönetir
    const arr = [...data] as Recipe[];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  } catch {
    return [];
  }
}

// ── Blog public queries ─────────────────────────────────────────

export async function getBlogCategories(): Promise<BlogCategory[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug, created_at")
      .order("name");
    if (error || !data) return [];
    return data as BlogCategory[];
  } catch { return []; }
}

const BLOG_POST_SELECT = "id, title, slug, excerpt, content, image_url, category_id, published, seo_title, seo_keywords, created_at, updated_at, category:category_id(id, name, slug, created_at)";

export async function getBlogPosts(categorySlug?: string): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    let query = supabase
      .from("blog_posts")
      .select(BLOG_POST_SELECT)
      .eq("published", true)
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error || !data) return [];
    const posts = data as unknown as BlogPost[];
    if (categorySlug) return posts.filter(p => p.category?.slug === categorySlug);
    return posts;
  } catch { return []; }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(BLOG_POST_SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as BlogPost;
  } catch { return null; }
}

/** Fetch all menus (admin) — includes drafts */
export async function getAllMenus(): Promise<MenuWithRecipes[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("menus")
      .select(MENU_WITH_RECIPES)
      .order("date", { ascending: false });

    if (error || !data) return [];
    return data as unknown as MenuWithRecipes[];
  } catch {
    return [];
  }
}
