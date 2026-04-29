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
  divColor: string;   // grid/divider lines — visible on both dark photos and header bg
  accentClr: string;  // accents on HEADER/FOOTER background (dots, footer text)
  imgAccent: string;  // accents on DARK backgrounds (photo overlays, right panel)
  mainTxt: string;    // primary text on header/footer bg
  subTxt: string;     // secondary text on header/footer bg
  bulletClr: string;  // ingredient bullet on dark panel
  badgeBg: string;    // step number badge on dark panel
  panelBg: string;    // right panel background
}

/* ── Color themes ───────────────────────────────────────────── */
const THEMES: Record<string, Theme> = {
  // Turuncu — koyu yanmış kahve grid; header turuncunun üstünde belirgin
  "#D2740B": { headerBg:"#D2740B", divColor:"#5C2800", accentClr:"#FCD34D", imgAccent:"#FCD34D", mainTxt:"#FFFFFF", subTxt:"#FEF3E2", bulletClr:"#E09A30", badgeBg:"rgba(210,116,11,0.8)",  panelBg:"rgba(10,4,0,0.87)" },
  // Kahve — bakır/terrakota grid; koyu kahveyle ton uyumu sağlar
  "#92400E": { headerBg:"#92400E", divColor:"#B8600A", accentClr:"#FCD34D", imgAccent:"#FCD34D", mainTxt:"#FFFFFF", subTxt:"#FEF3E2", bulletClr:"#D97706", badgeBg:"rgba(217,119,6,0.75)", panelBg:"rgba(10,4,0,0.87)" },
  // Zeytin — warm tan accents on olive background
  "#3D412A": { headerBg:"#3D412A", divColor:"#6B6B40", accentClr:"#D0B88D", imgAccent:"#D0B88D", mainTxt:"#FFFFFF", subTxt:"#E8E0D0", bulletClr:"#A09A6A", badgeBg:"rgba(120,115,70,0.8)", panelBg:"rgba(6,8,4,0.88)"  },
  // Gri — visible dark grid; light panel uses warm gold accents
  "#B8B3AE": { headerBg:"#B8B3AE", divColor:"#787370", accentClr:"#3D2B1F", imgAccent:"#E8D5A3", mainTxt:"#1C1917", subTxt:"#44403C", bulletClr:"#C8A070", badgeBg:"rgba(150,120,80,0.8)",  panelBg:"rgba(0,0,0,0.87)"  },
  // Kum — visible brown grid; panel uses amber accents
  "#D0B88D": { headerBg:"#D0B88D", divColor:"#9A7845", accentClr:"#3D2B1F", imgAccent:"#FCD34D", mainTxt:"#1C1917", subTxt:"#44403C", bulletClr:"#D2740B", badgeBg:"rgba(210,116,11,0.75)", panelBg:"rgba(0,0,0,0.87)"  },
  // Haki — çok koyu zeytin grid; haki header üstünde yüksek kontrast
  "#948E5C": { headerBg:"#948E5C", divColor:"#2E2B18", accentClr:"#FFF8EE", imgAccent:"#FFF8EE", mainTxt:"#FFFFFF", subTxt:"#F5EDD8", bulletClr:"#BEB890", badgeBg:"rgba(140,135,75,0.8)",  panelBg:"rgba(6,6,0,0.88)"  },
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
const TZ = "Europe/Istanbul";
function getSlideDate(): string {
  const d = new Date();
  const day  = d.toLocaleDateString("tr-TR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
  const week = d.toLocaleDateString("tr-TR", { timeZone: TZ, weekday: "long" });
  return `${day} ${week}`;
}
function getStoryDate(): string {
  return new Date().toLocaleDateString("tr-TR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
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

    const postHeaderTitle = searchParams.get("headerTitle") ?? "";
    const postHeaderDate  = searchParams.get("headerDate")  ?? "";
    return new ImageResponse(
      <AdminPostView card={card} theme={theme} content={content} headerTitle={postHeaderTitle} headerDate={postHeaderDate} autoDate={getSlideDate()} />,
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
      <AdminCoverYazisizView cards={cards} divColor={theme.divColor} />,
      { width: 1080, height: 1440, fonts }
    );
  }

  if (mode === "story") {
    return new ImageResponse(
      <AdminStoryView cards={cards} date={getStoryDate()} theme={theme} />,
      { width: 1080, height: 1920, fonts }
    );
  }

  /* cover-yazili (default) */
  const headerTitle = searchParams.get("headerTitle") ?? "";
  const headerDate  = searchParams.get("headerDate")  ?? "";
  return new ImageResponse(
    <AdminCoverYaziliView
      cards={cards} autoDate={getSlideDate()} theme={theme}
      headerTitle={headerTitle} headerDate={headerDate}
    />,
    { width: 1080, height: 1440, fonts }
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN POST VIEW — single recipe, slide-style, custom color
   1080 × 1440
════════════════════════════════════════════════════════════════ */
function AdminPostView({
  card, theme, content, headerTitle, headerDate, autoDate,
}: {
  card: Card; theme: Theme; content: string; headerTitle: string; headerDate: string; autoDate: string;
}) {
  const DIV    = 3;
  const PANEL_W = 520;

  // Header logic — same 3-state as AdminCoverYaziliView; default is "Günün Menüsü" + today's date
  const useDefault = !headerTitle && !headerDate;
  const effTitle   = useDefault ? "Günün Menüsü" : headerTitle;
  const effDate    = useDefault ? autoDate : headerDate;
  const showBoth   = !!(effTitle && effDate);

  // Max content height
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

      {/* Header — same 3-state logic as kapak yazılı */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 36px", flexShrink: 0 }}>
        {showBoth ? (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
            <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{effTitle}</div>
            <div style={{ width: 2, height: 40, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
            <div style={{ color: theme.mainTxt, fontSize: 24, display: "flex" }}>{effDate}</div>
          </div>
        ) : effTitle ? (
          <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{effTitle}</div>
        ) : effDate ? (
          <div style={{ color: theme.mainTxt, fontSize: 28, display: "flex" }}>{effDate}</div>
        ) : null}
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

        {/* Left overlay: title · gradient-fade divider · author */}
        <div style={{ position: "absolute", bottom: 90, left: 0, right: showPanel ? PANEL_W : 0, padding: "0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#FFFFFF", fontSize: 39, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {/* Gradient-fade divider — fades out so it appears to end under the title */}
              <div style={{ height: 1, width: "80%", background: "linear-gradient(to right, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.45) 55%, transparent 85%)", display: "flex" }} />
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, letterSpacing: 0.5, display: "flex" }}>{"Yazar:"}</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: 700, display: "flex" }}>{card.author}</div>
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
              <div style={{ color: theme.imgAccent, fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>{"MALZEMELER"}</div>
              <div style={{ height: 1, backgroundColor: theme.divColor, display: "flex", marginBottom: 9 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {visibleIngs.map((item, i) => {
                  if (item.endsWith(":")) {
                    return <div key={i} style={{ color: theme.imgAccent, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{item}</div>;
                  }
                  const ci = ingHeaderIdx(item);
                  if (ci !== -1) {
                    const header = item.slice(0, ci + 1);
                    const rest   = item.slice(ci + 1).trim();
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ color: theme.imgAccent, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{header}</div>
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
              <div style={{ color: theme.imgAccent, fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>{"HAZIRLANIŞ"}</div>
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

          {/* Link — sabit */}
          <div style={{ position: "absolute", bottom: 90, left: 16, right: 16, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, display: "flex" }}>{"Tarifin tamamına ulaşmak ve daha fazla içerik için:"}</div>
            <div style={{ color: theme.imgAccent, fontSize: 17, fontWeight: 700, display: "flex" }}>{"menugunlugu.com"}</div>
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
        <div style={{ color: theme.imgAccent, fontSize: 29, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize: 23, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 22, display: "flex" }}>{"Yazar: "}{card.author}</div>
        )}
      </div>
    </div>
  );
}

function AdminCoverYaziliView({
  cards, autoDate, theme, headerTitle, headerDate,
}: {
  cards: Card[]; autoDate: string; theme: Theme; headerTitle: string; headerDate: string;
}) {
  const DIV = 3;

  // Hangi değerler gösterilecek
  const useDefault = !headerTitle && !headerDate;
  const effTitle   = useDefault ? "Günün Menüsü" : headerTitle;
  const effDate    = useDefault ? autoDate : headerDate;
  const showBoth   = !!(effTitle && effDate);

  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Header */}
      <div style={{ height: 130, backgroundColor: theme.headerBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", flexShrink: 0 }}>
        {showBoth ? (
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
            <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{effTitle}</div>
            <div style={{ width: 2, height: 40, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
            <div style={{ color: theme.mainTxt, fontSize: 24, display: "flex" }}>{effDate}</div>
          </div>
        ) : effTitle ? (
          <div style={{ color: theme.mainTxt, fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>{effTitle}</div>
        ) : effDate ? (
          <div style={{ color: theme.mainTxt, fontSize: 28, display: "flex" }}>{effDate}</div>
        ) : null}
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

function AdminCoverYazisizView({ cards, divColor = "#D97706" }: { cards: Card[]; divColor?: string }) {
  const DIV = 3;
  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>
      <div style={{ height: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ width: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, display: "flex" }}>
            <PhotoCell card={cards[0]} />
            <div style={{ width: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
            <PhotoCell card={cards[1]} />
          </div>
          <div style={{ height: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
          <div style={{ flex: 1, display: "flex" }}>
            <PhotoCell card={cards[2]} />
            <div style={{ width: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
            <PhotoCell card={cards[3]} />
          </div>
        </div>
        <div style={{ width: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
      </div>
      <div style={{ height: DIV, backgroundColor: divColor, flexShrink: 0, display: "flex" }} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN STORY — 2×2 grid layout with header, link band, footer
   1080 × 1920
════════════════════════════════════════════════════════════════ */
function StoryCell({ card, theme, align }: { card: Card; theme: Theme; align: "left" | "right" }) {
  return (
    <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
      {card.img
        ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 60, display: "flex" }}>{"🍽️"}</div>
          </div>
      }
      {/* Bottom gradient */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 58%, transparent 100%)", display: "flex" }} />
      {/* Text overlay */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 22px 26px",
        display: "flex", flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: 5,
      }}>
        <div style={{ color: theme.imgAccent, fontSize: 16, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700, lineHeight: 1.2, display: "flex", textAlign: align }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 15, display: "flex" }}>{"Yazar: "}{card.author}</div>
        )}
      </div>
    </div>
  );
}

function AdminStoryView({ cards, date, theme }: { cards: Card[]; date: string; theme: Theme }) {
  const DIV = 3;
  // Total: 3+140+3+780+3+100+3+780+3+102+3 = 1920
  const HEADER_H = 140;
  const ROW_H    = 780;
  const LINK_H   = 100;
  const FOOTER_H = 102;

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Top outer border */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Header */}
      <div style={{ height: HEADER_H, backgroundColor: theme.headerBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ color: theme.accentClr, fontSize: 20, letterSpacing: 1.5, display: "flex" }}>{date}</div>
        <div style={{ color: theme.mainTxt, fontSize: 52, fontWeight: 700, lineHeight: 1, display: "flex" }}>{"Günün Menüsü"}</div>
      </div>

      {/* Divider */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Top row: Çorba (left) | Ana Yemek (right) */}
      <div style={{ height: ROW_H, display: "flex", flexShrink: 0 }}>
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
        <StoryCell card={cards[0]} theme={theme} align="left" />
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
        <StoryCell card={cards[1]} theme={theme} align="right" />
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
      </div>

      {/* Divider */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Link band */}
      <div style={{ height: LINK_H, backgroundColor: theme.headerBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{
          paddingLeft: 40, paddingRight: 40, paddingTop: 12, paddingBottom: 12,
          border: `2px solid ${theme.accentClr}`,
          borderRadius: 999,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ color: theme.accentClr, fontSize: 22, display: "flex" }}>{"🔗"}</div>
          <div style={{ color: theme.mainTxt, fontSize: 24, fontWeight: 700, letterSpacing: 1.5, display: "flex" }}>{"menugunlugu.com"}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Bottom row: Yardımcı Lezzet (left) | Tatlı (right) */}
      <div style={{ height: ROW_H, display: "flex", flexShrink: 0 }}>
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
        <StoryCell card={cards[2]} theme={theme} align="left" />
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
        <StoryCell card={cards[3]} theme={theme} align="right" />
        <div style={{ width: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
      </div>

      {/* Divider */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />

      {/* Footer */}
      <div style={{ height: FOOTER_H, backgroundColor: theme.headerBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
          <div style={{ color: theme.subTxt, fontSize: 16, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{"MENUGUNLUGU.COM"}</div>
          <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accentClr, display: "flex" }} />
        </div>
        <div style={{ color: theme.mainTxt, fontSize: 13, letterSpacing: 1.5, display: "flex" }}>{"TARİFİNİ YÜKLE & TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!"}</div>
      </div>

      {/* Bottom outer border */}
      <div style={{ height: DIV, backgroundColor: theme.divColor, flexShrink: 0, display: "flex" }} />
    </div>
  );
}
