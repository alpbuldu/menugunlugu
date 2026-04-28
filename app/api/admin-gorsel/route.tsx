import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import https from "node:https";
import http from "node:http";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Types ─────────────────────────────────────────────────── */
interface Card {
  id: string;
  title: string;
  author: string;
  cat: string;
  img: string | null;
  ingredients: string[];
  steps: string[];
}

interface Theme {
  headerBg: string;
  divColor: string;
  accentClr: string;
  mainTxt: string;
  subTxt: string;
  bulletClr: string;
  badgeBg: string;
  panelBg: string;
}

/* ── Color themes ───────────────────────────────────────────── */
const THEMES: Record<string, Theme> = {
  "#D2740B": { headerBg:"#D2740B", divColor:"#D2740B", accentClr:"#FCD34D", mainTxt:"#FFFFFF", subTxt:"#FEF3E2", bulletClr:"#D2740B", badgeBg:"rgba(210,116,11,0.75)", panelBg:"rgba(10,4,0,0.87)" },
  "#92400E": { headerBg:"#92400E", divColor:"#D97706", accentClr:"#FCD34D", mainTxt:"#FFFFFF", subTxt:"#FEF3E2", bulletClr:"#D97706", badgeBg:"rgba(217,119,6,0.75)",  panelBg:"rgba(10,4,0,0.87)" },
  "#3D412A": { headerBg:"#3D412A", divColor:"#948E5C", accentClr:"#D0B88D", mainTxt:"#FFFFFF", subTxt:"#E8E0D0", bulletClr:"#948E5C", badgeBg:"rgba(148,142,92,0.75)", panelBg:"rgba(8,10,6,0.88)"  },
  "#B8B3AE": { headerBg:"#B8B3AE", divColor:"#B8B3AE", accentClr:"#3D2B1F", mainTxt:"#1C1917", subTxt:"#44403C", bulletClr:"#7C5C47", badgeBg:"rgba(100,80,70,0.75)",  panelBg:"rgba(0,0,0,0.87)"  },
  "#D0B88D": { headerBg:"#D0B88D", divColor:"#C4A070", accentClr:"#3D2B1F", mainTxt:"#1C1917", subTxt:"#44403C", bulletClr:"#7C5C47", badgeBg:"rgba(100,80,70,0.75)",  panelBg:"rgba(0,0,0,0.87)"  },
  "#948E5C": { headerBg:"#948E5C", divColor:"#948E5C", accentClr:"#FFF8EE", mainTxt:"#FFFFFF", subTxt:"#F5EDD8", bulletClr:"#948E5C", badgeBg:"rgba(148,142,92,0.75)", panelBg:"rgba(8,6,0,0.88)"  },
};
const DEFAULT_THEME = THEMES["#92400E"];

const CAT_LABELS_TR: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

/* ── HTML parsers ───────────────────────────────────────────── */
function parseIngredients(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
}

function parseSteps(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">").replace(/&lt;/g, "<");
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 6);
}

/* ── Height estimators ──────────────────────────────────────── */
function ingHeaderIdx(item: string): number {
  const i = item.indexOf(":");
  return i > 1 && i <= 20 ? i : -1;
}

function estIngH(item: string): number {
  if (item.endsWith(":")) return 26;
  const ci = ingHeaderIdx(item);
  if (ci !== -1) {
    const rest = item.slice(ci + 1).trim();
    const restLines = Math.max(1, Math.ceil(rest.length / 46));
    return 26 + restLines * 21 + 5;
  }
  const lines = Math.max(1, Math.ceil(item.length / 46));
  return lines * 21 + 5;
}

function estStepH(step: string): number {
  const lines = Math.max(1, Math.ceil(step.length / 62));
  return lines * 21 + 6;
}

/* ── Image fetch ────────────────────────────────────────────── */
function nodeGet(url: string, hops = 5): Promise<Buffer | null> {
  return new Promise(resolve => {
    if (hops < 0) return resolve(null);
    let done = false;
    const fin = (v: Buffer | null) => { if (!done) { done = true; resolve(v); } };
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { "User-Agent": "menugunlugu/1.0" } }, res => {
      if (res.statusCode && [301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        res.resume(); nodeGet(res.headers.location, hops - 1).then(fin); return;
      }
      if (res.statusCode !== 200) { res.resume(); return fin(null); }
      const ch: Buffer[] = [];
      res.on("data", (c: Buffer) => ch.push(c));
      res.on("end",  () => fin(Buffer.concat(ch)));
      res.on("error", () => fin(null));
    });
    req.on("error", () => fin(null));
    req.setTimeout(10_000, () => { req.destroy(); fin(null); });
  });
}

async function getImg(url: string | null): Promise<string | null> {
  if (!url) return null;
  const buf = await nodeGet(url);
  if (!buf || buf.length === 0) return null;
  const isWebp = buf[0] === 0x52 && buf[1] === 0x49;
  const isGif  = buf[0] === 0x47 && buf[1] === 0x49;
  const isPng  = buf[0] === 0x89 && buf[1] === 0x50;
  if (isWebp || isGif) {
    try { const j = await sharp(buf).jpeg({ quality: 90 }).toBuffer(); return `data:image/jpeg;base64,${j.toString("base64")}`; }
    catch { return null; }
  }
  return `data:${isPng ? "image/png" : "image/jpeg"};base64,${buf.toString("base64")}`;
}

/* ── Date helpers ───────────────────────────────────────────── */
function getSlideDate(): string {
  const d = new Date();
  const day  = d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const week = d.toLocaleDateString("tr-TR", { weekday: "long" });
  return `${day} ${week}`;
}
function getStoryDate(): string {
  return new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ── Route ──────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("mode") ?? "post";
  const colorPm   = (searchParams.get("color") ?? "#92400E").toUpperCase();
  const content   = searchParams.get("content") ?? "both";
  const theme     = THEMES[colorPm] ?? DEFAULT_THEME;

  const supabase  = createAdminClient();

  const fontR = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf"));
  const fontB = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Medium.ttf"));
  const fonts = [
    { name: "Roboto", data: fontR, weight: 400 as const, style: "normal" as const },
    { name: "Roboto", data: fontB, weight: 700 as const, style: "normal" as const },
  ];

  /* ── mode=post: single recipe ── */
  if (mode === "post") {
    const recipeId = searchParams.get("recipeId") ?? "";
    if (!recipeId) return new Response("recipeId required", { status: 400 });

    const { data: r } = await supabase
      .from("recipes")
      .select("id, title, category, image_url, ingredients, instructions, submitted_by")
      .eq("id", recipeId).single();
    if (!r) return new Response("Not found", { status: 404 });

    let author = "";
    if (r.submitted_by) {
      const { data: p } = await supabase.from("profiles").select("username").eq("id", r.submitted_by).single();
      author = p?.username ?? "";
    } else {
      const { data: ap } = await supabase.from("admin_profile").select("username").single();
      author = ap?.username ?? "Menu Gunlugu";
    }

    const img  = await getImg(r.image_url ?? null);
    const card: Card = {
      id: r.id, title: r.title, author,
      cat: CAT_LABELS_TR[r.category] ?? r.category,
      img,
      ingredients: parseIngredients(r.ingredients ?? ""),
      steps: parseSteps(r.instructions ?? ""),
    };

    return new ImageResponse(
      <AdminPostView card={card} date={getSlideDate()} theme={theme} content={content} />,
      { width: 1080, height: 1440, fonts }
    );
  }

  /* ── 4-slot modes ── */
  const slotKeys = ["soup", "main", "side", "dessert"] as const;
  const ids = slotKeys.map(k => searchParams.get(k) ?? "");
  if (ids.some(id => !id)) return new Response("4 recipe IDs required", { status: 400 });

  const { data: rows } = await supabase
    .from("recipes")
    .select("id, title, category, image_url, submitted_by")
    .in("id", ids);
  if (!rows?.length) return new Response("Not found", { status: 404 });

  /* Batch profile fetch */
  const memberIds = [...new Set(rows.filter(r => r.submitted_by).map(r => r.submitted_by!))];
  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: ps } = await supabase.from("profiles").select("id, username").in("id", memberIds);
    for (const p of ps ?? []) profileMap[p.id] = p.username;
  }
  let adminName = "Menu Gunlugu";
  if (rows.some(r => !r.submitted_by)) {
    const { data: ap } = await supabase.from("admin_profile").select("username").single();
    adminName = ap?.username ?? "Menu Gunlugu";
  }

  const byId: Record<string, (typeof rows)[number]> = {};
  for (const r of rows) byId[r.id] = r;

  /* Build cards — sequential image fetch */
  const cards: Card[] = [];
  for (let i = 0; i < slotKeys.length; i++) {
    const r = byId[ids[i]];
    const author = !r ? "" : (r.submitted_by ? (profileMap[r.submitted_by] ?? "") : adminName);
    const img    = r ? await getImg(r.image_url ?? null) : null;
    cards.push({
      id:    r?.id ?? "",
      title: r?.title ?? "—",
      author,
      cat:   CAT_LABELS_TR[slotKeys[i]],
      img,
      ingredients: [],
      steps: [],
    });
  }

  if (mode === "cover-yazisiz") {
    return new ImageResponse(
      <AdminCoverYazisizView cards={cards} />,
      { width: 1080, height: 1440, fonts }
    );
  }

  if (mode === "story") {
    return new ImageResponse(
      <AdminStoryView cards={cards} date={getStoryDate()} />,
      { width: 1080, height: 1920, fonts }
    );
  }

  /* cover-yazili (default) */
  return new ImageResponse(
    <AdminCoverYaziliView cards={cards} date={getSlideDate()} theme={theme} />,
    { width: 1080, height: 1440, fonts }
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN POST VIEW — single recipe, slide-style, custom color
   1080 × 1440
════════════════════════════════════════════════════════════════ */
function AdminPostView({
  card, date, theme, content,
}: {
  card: Card; date: string; theme: Theme; content: string;
}) {
  const DIV    = 3;
  const PANEL_W = 520;

  // Max content height (same layout constants as menu-karti SlideView)
  const CONTENT_AREA_H = 1440 - 130 - DIV - 130 - DIV; // 1174
  const OVERLAY_BOTTOM = CONTENT_AREA_H - 90;            // 1084
  const YAZAR_TOP      = OVERLAY_BOTTOM - 19;             // 1065
  const LINK_H         = 62;
  const MAX_CONTENT_H  = YAZAR_TOP - 20 - LINK_H;        // 983

  const ING_HEADER_H  = 30;
  const STEP_HEADER_H = 44;

  const showPanel = content !== "none";
  const showIng   = content === "ingredients" || content === "both";
  const showSteps = content === "steps"       || content === "both";

  const visibleIngs = showIng ? card.ingredients : [];
  let usedH = 0;
  const visibleSteps: string[] = [];

  if (showIng) usedH += ING_HEADER_H + visibleIngs.reduce((s, i) => s + estIngH(i), 0);

  if (showSteps && card.steps.length > 0) {
    usedH += STEP_HEADER_H;
    if (usedH <= MAX_CONTENT_H) {
      for (const step of card.steps) {
        const h = estStepH(step);
        if (usedH + h > MAX_CONTENT_H) break;
        visibleSteps.push(step);
        usedH += h;
      }
    }
  }

  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Header */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
          <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{"Günün Menüsü"}</div>
          <div style={{ width: 2, height: 40, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
          <div style={{ color: theme.mainTxt, fontSize: 24, display: "flex" }}>{date}</div>
        </div>
      </div>
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Main content */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>

        {/* Background image */}
        {card.img
          ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 80, display: "flex" }}>{"🍽️"}</div>
            </div>
        }

        {/* Left gradient — full width when no panel */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: showPanel ? PANEL_W : 0, height: "62%", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)", display: "flex" }} />

        {/* Left overlay: title · divider · author (no category label) */}
        <div style={{ position: "absolute", bottom: 90, left: 0, right: showPanel ? PANEL_W : 0, padding: "0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#FFFFFF", fontSize: 39, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.35)", display: "flex" }} />
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 0.5, display: "flex" }}>{"Yazar:"}</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 19, fontWeight: 700, display: "flex" }}>{card.author}</div>
            </div>
          )}
        </div>

        {/* Right panel — hidden when content=none */}
        {showPanel && (
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: PANEL_W,
          background: theme.panelBg,
          display: "flex", flexDirection: "column",
          padding: "20px 16px",
          overflow: "hidden",
        }}>

          {/* MALZEMELER */}
          {showIng && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: theme.accentClr, fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>{"MALZEMELER"}</div>
              <div style={{ height: 1, backgroundColor: theme.divColor, display: "flex", marginBottom: 9 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {visibleIngs.map((item, i) => {
                  if (item.endsWith(":")) {
                    return <div key={i} style={{ color: theme.accentClr, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{item}</div>;
                  }
                  const ci = ingHeaderIdx(item);
                  if (ci !== -1) {
                    const header = item.slice(0, ci + 1);
                    const rest   = item.slice(ci + 1).trim();
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ color: theme.accentClr, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{header}</div>
                        {rest && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                            <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.bulletClr, marginTop: 6, flexShrink: 0, display: "flex" }} />
                            <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15.5, lineHeight: 1.25, display: "flex" }}>{rest}</div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                      <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.bulletClr, marginTop: 6, flexShrink: 0, display: "flex" }} />
                      <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15.5, lineHeight: 1.25, display: "flex" }}>{item}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HAZIRLANIŞ */}
          {showSteps && visibleSteps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {showIng && <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.18)", display: "flex", margin: "10px 0 8px" }} />}
              <div style={{ color: theme.accentClr, fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>{"HAZIRLANIŞ"}</div>
              <div style={{ height: 1, backgroundColor: theme.divColor, display: "flex", marginBottom: 9 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visibleSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ minWidth: 17, height: 17, borderRadius: 2, backgroundColor: theme.badgeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ color: "#FFF", fontSize: 10, fontWeight: 700, display: "flex" }}>{i + 1}</div>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, lineHeight: 1.3, display: "flex" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link — sabit, sol "Yazar:" hizasında (bottom: 90) */}
          <div style={{ position: "absolute", bottom: 90, left: 16, right: 16, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, display: "flex" }}>{"Tarifin tamamı ve daha fazla tarif için:"}</div>
            <div style={{ color: theme.accentClr, fontSize: 17, fontWeight: 700, display: "flex" }}>{"menugunlugu.com"}</div>
          </div>
        </div>
        )}
      </div>

      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Footer */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
          <div style={{ color: theme.subTxt, fontSize: 18, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{"MENUGUNLUGU.COM"}</div>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
        </div>
        <div style={{ color: theme.mainTxt, fontSize: 14, letterSpacing: 1.5, display: "flex" }}>{"TARİFİNİ YÜKLE & TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!"}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN COVER YAZILI — 4-dish PostView with custom color
   1080 × 1440
════════════════════════════════════════════════════════════════ */
function ThemedImageCell({ card, theme }: { card: Card; theme: Theme }) {
  return (
    <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
      {card.img
        ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 60, display: "flex" }}>{"🍽️"}</div>
          </div>
      }
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 48%, transparent 100%)", display: "flex" }} />
      <div style={{ position: "absolute", bottom: 46, left: 0, padding: "0 26px", display: "flex", flexDirection: "column", gap: 8, maxWidth: "90%" }}>
        <div style={{ color: theme.accentClr, fontSize: 29, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize: 23, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 22, display: "flex" }}>{"Yazar: "}{card.author}</div>
        )}
      </div>
    </div>
  );
}

function AdminCoverYaziliView({ cards, date, theme }: { cards: Card[]; date: string; theme: Theme }) {
  const DIV = 3;
  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Header */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
          <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{"Günün Menüsü"}</div>
          <div style={{ width: 2, height: 40, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
          <div style={{ color: theme.mainTxt, fontSize: 24, display: "flex" }}>{date}</div>
        </div>
      </div>
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* 2×2 grid */}
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, display: "flex" }}>
            <ThemedImageCell card={cards[0]} theme={theme} />
            <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
            <ThemedImageCell card={cards[1]} theme={theme} />
          </div>
          <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
          <div style={{ flex: 1, display: "flex" }}>
            <ThemedImageCell card={cards[2]} theme={theme} />
            <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
            <ThemedImageCell card={cards[3]} theme={theme} />
          </div>
        </div>
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
      </div>

      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Footer */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
          <div style={{ color: theme.subTxt, fontSize: 18, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{"MENUGUNLUGU.COM"}</div>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
        </div>
        <div style={{ color: theme.mainTxt, fontSize: 14, letterSpacing: 1.5, display: "flex" }}>{"TARİFİNİ YÜKLE & TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!"}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN COVER YAZISIZ — 4-dish photo collage, no text, fixed orange dividers
   1080 × 1440
════════════════════════════════════════════════════════════════ */
function PhotoCell({ card }: { card: Card }) {
  return (
    <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
      {card.img
        ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 80, display: "flex" }}>{"🍽️"}</div>
          </div>
      }
    </div>
  );
}

function AdminCoverYazisizView({ cards }: { cards: Card[] }) {
  const DIV    = 3;
  const ORANGE = "#D97706";
  return (
    <div style={{ width: 1080, height: 1440, display: "flex", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>
      <div style={{ width: DIV, backgroundColor: ORANGE, flexShrink: 0, display: "flex" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex" }}>
          <PhotoCell card={cards[0]} />
          <div style={{ width: DIV, backgroundColor: ORANGE, flexShrink: 0, display: "flex" }} />
          <PhotoCell card={cards[1]} />
        </div>
        <div style={{ height: DIV, backgroundColor: ORANGE, flexShrink: 0, display: "flex" }} />
        <div style={{ flex: 1, display: "flex" }}>
          <PhotoCell card={cards[2]} />
          <div style={{ width: DIV, backgroundColor: ORANGE, flexShrink: 0, display: "flex" }} />
          <PhotoCell card={cards[3]} />
        </div>
      </div>
      <div style={{ width: DIV, backgroundColor: ORANGE, flexShrink: 0, display: "flex" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN STORY — same as menu-karti StoryView (fixed amber theme)
   1080 × 1920
════════════════════════════════════════════════════════════════ */
function AdminStoryView({ cards, date }: { cards: Card[]; date: string }) {
  const DIV     = 3;
  const FIRST_H = 522;
  const OTHER_H = 463;

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", position: "relative", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Strip 1 — çorba + header overlay */}
        <div style={{ height: FIRST_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {cards[0].img
            ? <img src={cards[0].img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 80, display: "flex" }}>{"🍽️"}</div>
              </div>
          }
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "78%", background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)", display: "flex" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)", display: "flex" }} />
          <div style={{ position: "absolute", top: 215, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ color: "#FCD34D", fontSize: 24, letterSpacing: 1, display: "flex" }}>{date}</div>
            <div style={{ color: "#FFFFFF", fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>{"Günün Menüsü"}</div>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 26px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#FCD34D", fontSize: 22, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[0].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[0].title}</div>
            {cards[0].author && <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>{"Yazar: "}{cards[0].author}</div>}
          </div>
        </div>

        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

        {/* Strip 2 — ana yemek, text top-right */}
        <div style={{ height: OTHER_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {cards[1].img
            ? <img src={cards[1].img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 60, display: "flex" }}>{"🍽️"}</div></div>
          }
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)", display: "flex" }} />
          <div style={{ position: "absolute", top: 0, right: 0, padding: "0 26px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={{ color: "#FCD34D", fontSize: 26, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[1].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[1].title}</div>
            {cards[1].author && <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>{"Yazar: "}{cards[1].author}</div>}
          </div>
        </div>

        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

        {/* Strip 3 — yardimci lezzet, text top-left */}
        <div style={{ height: OTHER_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {cards[2].img
            ? <img src={cards[2].img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 60, display: "flex" }}>{"🍽️"}</div></div>
          }
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)", display: "flex" }} />
          <div style={{ position: "absolute", top: 0, left: 0, padding: "0 26px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ color: "#FCD34D", fontSize: 26, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[2].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[2].title}</div>
            {cards[2].author && <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>{"Yazar: "}{cards[2].author}</div>}
          </div>
        </div>

        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

        {/* Strip 4 — tatlı, text top-right */}
        <div style={{ height: OTHER_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {cards[3].img
            ? <img src={cards[3].img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 60, display: "flex" }}>{"🍽️"}</div></div>
          }
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)", display: "flex" }} />
          <div style={{ position: "absolute", top: 0, right: 0, padding: "0 26px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <div style={{ color: "#FCD34D", fontSize: 26, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[3].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[3].title}</div>
            {cards[3].author && <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>{"Yazar: "}{cards[3].author}</div>}
          </div>
        </div>

      </div>

      <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* Bottom fade + URL */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 320, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)", display: "flex" }} />
      <div style={{ position: "absolute", bottom: 162, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{"www.menugunlugu.com"}</div>
        <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: 1.8, display: "flex" }}>{"TARİFİNİ YÜKLE & TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!"}</div>
      </div>
    </div>
  );
}
