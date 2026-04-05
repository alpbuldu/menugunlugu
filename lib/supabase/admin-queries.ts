import { createAdminClient } from "./server";
import type { Recipe, Category, BlogCategory, BlogPost } from "@/lib/types";

const RECIPE_FIELDS =
  "id, title, slug, category, ingredients, instructions, image_url, created_at";

// Menu join without slug — avoids PostgREST schema-cache issues during development
const MENU_ADMIN_SELECT = `
  id, date, status, soup_id, main_id, side_id, dessert_id, created_at,
  soup:soup_id(id, title, category),
  main:main_id(id, title, category),
  side:side_id(id, title, category),
  dessert:dessert_id(id, title, category)
`.trim();

export interface AdminMenu {
  id: string;
  date: string;
  status: "draft" | "published";
  soup_id: string;
  main_id: string;
  side_id: string;
  dessert_id: string;
  created_at: string;
  soup:    { id: string; title: string; category: Category };
  main:    { id: string; title: string; category: Category };
  side:    { id: string; title: string; category: Category };
  dessert: { id: string; title: string; category: Category };
}

function isAdminConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("your-service")
  );
}

export async function adminGetAllRecipes(): Promise<Recipe[]> {
  if (!isAdminConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .order("category")
      .order("title");
    if (error) { console.error("[adminGetAllRecipes]", error.message); return []; }
    return (data ?? []) as Recipe[];
  } catch (e) { console.error("[adminGetAllRecipes] unexpected:", e); return []; }
}

export async function adminGetRecipeById(id: string): Promise<Recipe | null> {
  if (!isAdminConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recipes")
      .select(RECIPE_FIELDS)
      .eq("id", id)
      .single();
    if (error) { console.error("[adminGetRecipeById]", error.message); return null; }
    return data as Recipe;
  } catch (e) { console.error("[adminGetRecipeById] unexpected:", e); return null; }
}

export async function adminGetAllMenus(): Promise<AdminMenu[]> {
  if (!isAdminConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("menus")
      .select(MENU_ADMIN_SELECT)
      .order("date", { ascending: false });
    if (error) { console.error("[adminGetAllMenus]", error.message); return []; }
    return (data ?? []) as unknown as AdminMenu[];
  } catch (e) { console.error("[adminGetAllMenus] unexpected:", e); return []; }
}

export async function adminGetMenuById(id: string): Promise<AdminMenu | null> {
  if (!isAdminConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("menus")
      .select(MENU_ADMIN_SELECT)
      .eq("id", id)
      .single();
    if (error) { console.error("[adminGetMenuById]", error.message); return null; }
    return data as unknown as AdminMenu;
  } catch (e) { console.error("[adminGetMenuById] unexpected:", e); return null; }
}

// ── Blog ────────────────────────────────────────────────────────

export async function adminGetAllBlogCategories(): Promise<BlogCategory[]> {
  if (!isAdminConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id, name, slug, created_at")
      .order("name");
    if (error) { console.error("[adminGetAllBlogCategories]", error.message); return []; }
    return (data ?? []) as BlogCategory[];
  } catch (e) { console.error("[adminGetAllBlogCategories] unexpected:", e); return []; }
}

export async function adminGetAllBlogPosts(): Promise<BlogPost[]> {
  if (!isAdminConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, image_url, category_id, created_at, category:category_id(id, name, slug, created_at)")
      .order("created_at", { ascending: false });
    if (error) { console.error("[adminGetAllBlogPosts]", error.message); return []; }
    return (data ?? []) as unknown as BlogPost[];
  } catch (e) { console.error("[adminGetAllBlogPosts] unexpected:", e); return []; }
}

export async function adminGetBlogPostById(id: string): Promise<BlogPost | null> {
  if (!isAdminConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, image_url, category_id, created_at, category:category_id(id, name, slug, created_at)")
      .eq("id", id)
      .single();
    if (error) { console.error("[adminGetBlogPostById]", error.message); return null; }
    return data as unknown as BlogPost;
  } catch (e) { console.error("[adminGetBlogPostById] unexpected:", e); return null; }
}
