import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { MenuPdfDocument, ensureFonts, type PdfRecipeData } from "./MenuPdfDocument";
import https from "node:https";
import http from "node:http";
import sharp from "sharp";

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

const TR_DAYS   = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function formatDate(d: Date): string {
  // Intl tr-TR bazı Node ortamlarında Türkçe karakterleri düz ASCII verebiliyor;
  // güvenli manuel formatlama kullan.
  const weekday = TR_DAYS[d.getDay()];
  const day     = d.getDate();
  const month   = TR_MONTHS[d.getMonth()];
  const year    = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
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
    const authorUrl = author ? `menugunlugu.com/uye/${author}` : "menugunlugu.com";

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

  /* Pre-fetch images → base64 data URIs via node:https (bypasses Next.js fetch cache) */
  function nodeGet(url: string, redirects = 5): Promise<Buffer | null> {
    return new Promise((resolve) => {
      if (redirects < 0) { resolve(null); return; }
      let resolved = false;
      const done = (v: Buffer | null) => { if (!resolved) { resolved = true; resolve(v); } };

      const mod = url.startsWith("https") ? https : http;
      const req = mod.get(url, { headers: { "User-Agent": "menugunlugu-pdf/1.0" } }, (res) => {
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          nodeGet(res.headers.location, redirects - 1).then(done);
          return;
        }
        if (res.statusCode !== 200) {
          console.error(`[menu-pdf] nodeGet ${res.statusCode}: ${url}`);
          res.resume();
          done(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => done(Buffer.concat(chunks)));
        res.on("error", (e) => { console.error("[menu-pdf] stream error:", e); done(null); });
      });
      req.on("error", (e) => { console.error("[menu-pdf] req error:", e); done(null); });
      req.setTimeout(12_000, () => { req.destroy(); done(null); });
    });
  }

  async function fetchImageDataUri(url: string | null): Promise<string | null> {
    if (!url) return null;

    const buf = await nodeGet(url);
    if (!buf || buf.length === 0) {
      console.error(`[menu-pdf] fetch failed: ${url}`);
      return null;
    }

    // Detect format from magic bytes
    const isWebp = buf[0] === 0x52 && buf[1] === 0x49; // RIFF
    const isGif  = buf[0] === 0x47 && buf[1] === 0x49; // GI
    const isPng  = buf[0] === 0x89 && buf[1] === 0x50; // .PNG

    // react-pdf only supports JPEG and PNG — convert WebP/GIF to JPEG via sharp
    if (isWebp || isGif) {
      try {
        const jpeg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
        return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
      } catch (e) {
        console.error(`[menu-pdf] sharp convert error: ${url}`, e);
        return null;
      }
    }

    const mime = isPng ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  // Fetch sequentially
  const imageUris: (string | null)[] = [];
  const debugInfo: Record<string, { url: string | null; fetched: boolean; bytes: number }> = {};
  for (const key of SLOTS) {
    const url = recipes[key].image_url;
    const dataUri = await fetchImageDataUri(url);
    imageUris.push(dataUri);
    debugInfo[key] = { url, fetched: !!dataUri, bytes: dataUri ? Math.round(dataUri.length * 0.75) : 0 };
  }

  // ?debug=1 → return JSON instead of PDF
  if (searchParams.get("debug") === "1") {
    return NextResponse.json({ recipes: Object.fromEntries(SLOTS.map(k => [k, recipes[k].title])), images: debugInfo });
  }

  SLOTS.forEach((key, i) => {
    recipes[key].image_url = imageUris[i];
  });

  /* Register fonts */
  const origin = new URL(request.url).origin;
  ensureFonts(origin);

  /* Render PDF */
  const dateStr = formatDate(new Date());

  try {
    // @ts-expect-error react-pdf types differ from React types
    const buffer = await renderToBuffer(
      createElement(MenuPdfDocument, { recipes, dateStr })
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
