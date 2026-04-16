import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { MenuPdfDocument, ensureFonts, type PdfRecipeData } from "./MenuPdfDocument";

export const dynamic = "force-dynamic";
// Use Node.js runtime (not edge) for react-pdf
export const runtime = "nodejs";

/* ── HTML parser ─────────────────────────────────────────────── */
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

/* ── Route ───────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const ids = {
    soup:    searchParams.get("soup")    ?? "",
    main:    searchParams.get("main")    ?? "",
    side:    searchParams.get("side")    ?? "",
    dessert: searchParams.get("dessert") ?? "",
  };

  const allIds = Object.values(ids).filter(Boolean);
  if (allIds.length !== 4) {
    return NextResponse.json({ error: "4 recipe ID required" }, { status: 400 });
  }

  const supabase = await createClient();

  /* Fetch recipes */
  const { data: rows, error } = await supabase
    .from("recipes")
    .select("id, title, category, image_url, ingredients, instructions, servings, submitted_by")
    .in("id", allIds);

  if (error || !rows?.length) {
    return NextResponse.json({ error: "Recipes not found" }, { status: 404 });
  }

  const byId: Record<string, typeof rows[number]> = {};
  for (const r of rows) byId[r.id] = r;

  /* Fetch member profiles */
  const memberIds = [...new Set(
    rows.filter((r) => r.submitted_by).map((r) => r.submitted_by!)
  )];

  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", memberIds);
    for (const p of profiles ?? []) profileMap[p.id] = p.username;
  }

  /* Fetch admin profile */
  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username")
    .single();
  const adminName = adminProfile?.username ?? "Menü Günlüğü";

  /* Build recipe data per slot */
  const SLOTS: Category[] = ["soup", "main", "side", "dessert"];

  function buildRecipe(id: string): PdfRecipeData {
    const r = byId[id];
    const isAdmin = !r.submitted_by;
    const author = isAdmin ? adminName : (profileMap[r.submitted_by!] ?? "");
    const authorUrl = isAdmin
      ? "menugunlugu.com"
      : author ? `menugunlugu.com/uye/${author}` : "";

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      image_url: r.image_url ?? null,
      ingredients: parseIngredients(r.ingredients ?? ""),
      instructions: parseInstructions(r.instructions ?? ""),
      servings: r.servings ?? null,
      author,
      authorUrl,
    };
  }

  const recipes = {
    soup:    buildRecipe(ids.soup),
    main:    buildRecipe(ids.main),
    side:    buildRecipe(ids.side),
    dessert: buildRecipe(ids.dessert),
  };

  /* Consolidated ingredient list */
  const allIngredients: string[] = [];
  for (const key of SLOTS) allIngredients.push(...recipes[key].ingredients);

  /* Register fonts from public CDN (lazy, runs once per cold start) */
  const origin = new URL(request.url).origin;
  await ensureFonts(origin);

  /* Render PDF */
  const dateStr = formatDate(new Date());

  try {
    // @ts-expect-error react-pdf types differ from React types
    const buffer = await renderToBuffer(
      createElement(MenuPdfDocument, { recipes, allIngredients, dateStr })
    );

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="gunun-menusu-${new Date().toISOString().slice(0, 10)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[menu-pdf-download] render error:", err);
    return NextResponse.json(
      { error: "PDF oluşturulamadı", detail: String(err) },
      { status: 500 }
    );
  }
}
