import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import https from "node:https";
import http from "node:http";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = [
  { key: "soup"    as const, cat: "Çorba" },
  { key: "main"    as const, cat: "Ana Yemek" },
  { key: "side"    as const, cat: "Yardımcı Lezzet" },
  { key: "dessert" as const, cat: "Tatlı" },
];

type Key = "soup" | "main" | "side" | "dessert";
interface Card { title: string; author: string; cat: string; img: string | null; ingredients: string[]; steps: string[] }

function parseIngredients(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && !l.endsWith(":"));
}

function parseSteps(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<");
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 6);
}

/* ── Image fetch ─────────────────────────────────────────────── */
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

/* ── Route ───────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isStory  = searchParams.get("format") === "story";
  const slideStr = searchParams.get("slide");
  const slideIdx = slideStr !== null ? parseInt(slideStr, 10) : -1; // -1 = kapak

  const ids: Record<Key, string> = {
    soup:    searchParams.get("soup")    ?? "",
    main:    searchParams.get("main")    ?? "",
    side:    searchParams.get("side")    ?? "",
    dessert: searchParams.get("dessert") ?? "",
  };
  if (Object.values(ids).some(v => !v)) return new Response("4 IDs required", { status: 400 });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("recipes").select("id, title, image_url, submitted_by, ingredients, instructions")
    .in("id", Object.values(ids));
  if (!rows?.length) return new Response("Not found", { status: 404 });

  const byId: Record<string, (typeof rows)[number]> = {};
  for (const r of rows) byId[r.id] = r;

  const memberIds = [...new Set(rows.filter(r => r.submitted_by).map(r => r.submitted_by!))];
  const profileMap: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: ps } = await supabase.from("profiles").select("id, username").in("id", memberIds);
    for (const p of ps ?? []) profileMap[p.id] = p.username;
  }
  const { data: ap } = await supabase.from("admin_profile").select("username").single();
  const adminName = ap?.username ?? "Menü Günlüğü";

  const cards: Card[] = [];
  for (const s of SLOTS) {
    const r = byId[ids[s.key]];
    const author = !r?.submitted_by ? adminName : (profileMap[r.submitted_by!] ?? "");
    const img = await getImg(r?.image_url ?? null);
    const ingredients = parseIngredients(r?.ingredients ?? "");
    const steps       = parseSteps(r?.instructions ?? "");
    cards.push({ title: r?.title ?? "—", author, cat: s.cat, img, ingredients, steps });
  }

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Slide header formatı: "27 Nisan 2026 Pazartesi"
  const _d = new Date();
  const _dayPart = _d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const _weekdayPart = _d.toLocaleDateString("tr-TR", { weekday: "long" });
  const slideDateStr = `${_dayPart} ${_weekdayPart}`;

  const fontR = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf"));
  const fontB = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Medium.ttf"));

  // slide=1..4 → bireysel tarif görseli; slide=-1 veya yok → kapak/story
  const isSlide = slideIdx >= 1 && slideIdx <= 4;
  const slideCard = isSlide ? cards[slideIdx - 1] : null;

  return new ImageResponse(
    isSlide && slideCard
      ? <SlideView card={slideCard} date={slideDateStr} />
      : isStory
        ? <StoryView cards={cards} date={dateStr} />
        : <PostView cards={cards} date={slideDateStr} />,
    {
      width: 1080, height: isStory && !isSlide ? 1920 : 1440,
      fonts: [
        { name: "Roboto", data: fontR, weight: 400, style: "normal" },
        { name: "Roboto", data: fontB, weight: 700, style: "normal" },
      ],
    }
  );
}

/* ── Shared: image cell with configurable text overlay ───────── */
function ImageCell({
  card,
  fontSize = 21,
  authorPrefix = false,
  textPosition = "bottom",
}: {
  card: Card;
  fontSize?: number;
  authorPrefix?: boolean;
  textPosition?: "bottom" | "top-left" | "top-right";
}) {
  const isTop   = textPosition !== "bottom";
  const isRight = textPosition === "top-right";

  return (
    <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>
      {/* Background image */}
      {card.img
        ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 60, display: "flex" }}>🍽️</div>
          </div>
      }
      {/* Gradient — direction matches text position */}
      {isTop
        ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)", display: "flex" }} />
        : <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "70%", background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 48%, transparent 100%)", display: "flex" }} />
      }
      {/* Text */}
      <div style={{
        position: "absolute",
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        ...(isRight ? { right: 0 } : { left: 0 }),
        padding: "28px 26px",
        display: "flex",
        flexDirection: "column",
        alignItems: isRight ? "flex-end" : "flex-start",
        gap: 5,
        maxWidth: "85%",
      }}>
        <div style={{ color: "#FCD34D", fontSize: 26, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>
            {authorPrefix ? `Yazar: ${card.author}` : card.author}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Shared header & footer (kapakla aynı tasarım dili)
════════════════════════════════════════════════════════════════ */
function SharedHeader({ date }: { date: string }) {
  return (
    <div style={{ height: 108, backgroundColor: "#92400E", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
        <div style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 700, lineHeight: 1, display: "flex" }}>Günün Menüsü</div>
        <div style={{ width: 2, height: 36, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
        <div style={{ color: "#FFFFFF", fontSize: 22, display: "flex" }}>{date}</div>
      </div>
    </div>
  );
}

function SharedFooter() {
  return (
    <div style={{ height: 70, backgroundColor: "#92400E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
        <div style={{ color: "#FEF3E2", fontSize: 13, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>MENUGUNLUGU.COM</div>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
      </div>
      <div style={{ color: "#FCD34D", fontSize: 10, letterSpacing: 1.5, display: "flex" }}>TARİFİNİ YÜKLE &amp; TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SLIDE  1080 × 1350
   Sol: tam görsel + sol-alt overlay (kategori, başlık, yazar, detaylar)
   Sağ: 400px panel — malzemeler + hazırlanış, overflow: hidden ile kliplenmiş
════════════════════════════════════════════════════════════════ */
function SlideView({ card, date }: { card: Card; date: string }) {
  const DIV     = 3;
  const PANEL_W = 400; // 330 → 400: daha geniş panel, daha az satır kırılması

  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>
      <SharedHeader date={date} />
      <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* Ana içerik alanı */}
      <div style={{ flex: 1, position: "relative", display: "flex", overflow: "hidden" }}>

        {/* Arka plan görsel */}
        {card.img
          ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 80, display: "flex" }}>🍽️</div>
            </div>
        }

        {/* Sol-alt gradyan (panel genişliği kadar içe çekik) */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: PANEL_W, height: "62%", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)", display: "flex" }} />

        {/* Sol-alt: kategori · başlık · yazar · Detaylar için */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: PANEL_W, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ color: "#FCD34D", fontSize: 18, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{card.cat.toUpperCase()}</div>
          <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, display: "flex" }}>Yazar:</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 700, display: "flex" }}>{card.author}</div>
            </div>
          )}
          {/* Detaylar için — tek satır yan yana */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, display: "flex" }}>Detaylar için</div>
            <div style={{ color: "#FCD34D", fontSize: 15, fontWeight: 700, display: "flex" }}>menugunlugu.com</div>
          </div>
        </div>

        {/* ── Sağ panel ── */}
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: 0, width: PANEL_W,
          background: "rgba(10,4,0,0.87)",
          display: "flex", flexDirection: "column",
          padding: "20px 16px",
          overflow: "hidden", // taşan içerik düzgün kliplensin
        }}>

          {/* MALZEMELER */}
          <div style={{ color: "#FCD34D", fontSize: 11, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>MALZEMELER</div>
          <div style={{ height: 1, backgroundColor: "#D97706", display: "flex", marginBottom: 9 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {card.ingredients.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#D97706", marginTop: 5, flexShrink: 0, display: "flex" }} />
                <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 13.5, lineHeight: 1.25, display: "flex" }}>{item}</div>
              </div>
            ))}
          </div>

          {/* HAZIRLANIŞ */}
          {card.steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.18)", display: "flex", margin: "10px 0 8px" }} />
              <div style={{ color: "#FCD34D", fontSize: 11, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>HAZIRLANIŞ</div>
              <div style={{ height: 1, backgroundColor: "#D97706", display: "flex", marginBottom: 9 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {card.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ minWidth: 15, height: 15, borderRadius: 2, backgroundColor: "rgba(217,119,6,0.75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ color: "#FFF", fontSize: 9, fontWeight: 700, display: "flex" }}>{i + 1}</div>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, lineHeight: 1.3, display: "flex" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
      <SharedFooter />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   POST  1080 × 1350
   Slim cream header · full-bleed 2×2 image grid · amber dividers
════════════════════════════════════════════════════════════════ */
function PostView({ cards, date }: { cards: Card[]; date: string }) {
  const HEAD = 108;
  const FOOT = 70;
  const DIV  = 3;   // amber divider thickness

  return (
    <div style={{ width: 1080, height: 1440, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      <SharedHeader date={date} />

      {/* Top amber line */}
      <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* 2×2 image grid — with left/right amber borders */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Left amber border */}
        <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
        {/* Grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Row 1 */}
          <div style={{ flex: 1, display: "flex" }}>
            <ImageCell card={cards[0]} fontSize={19} authorPrefix />
            <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
            <ImageCell card={cards[1]} fontSize={19} authorPrefix />
          </div>
          {/* Row divider */}
          <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
          {/* Row 2 */}
          <div style={{ flex: 1, display: "flex" }}>
            <ImageCell card={cards[2]} fontSize={19} authorPrefix />
            <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
            <ImageCell card={cards[3]} fontSize={19} authorPrefix />
          </div>
        </div>
        {/* Right amber border */}
        <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
      </div>

      {/* Bottom amber line */}
      <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* Footer */}
      <div style={{ height: FOOT, backgroundColor: "#92400E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
          <div style={{ color: "#FEF3E2", fontSize: 13, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>MENUGUNLUGU.COM</div>
          <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
        </div>
        <div style={{ color: "#FCD34D", fontSize: 10, letterSpacing: 1.5, display: "flex" }}>TARİFİNİ YÜKLE &amp; TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!</div>
      </div>

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STORY  1080 × 1920
   Instagram safe zones:
     top ~200px  → UI (progress bar + profil)
     bottom ~150px → reply bar
   → Header ayrı blok yok; ilk fotoğrafın üstüne gradient, metin y≥215'te
   → Footer yok (kapatılıyordu); @menugunlugu header gradient'inde
════════════════════════════════════════════════════════════════ */
function StoryView({ cards, date }: { cards: Card[]; date: string }) {
  const DIV     = 3;
  // 522 + 3 + 463 + 3 + 463 + 3 + 463 = 1920
  const FIRST_H = 522;
  const OTHER_H = 463;

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", position: "relative", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Left amber border */}
      <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* Strips column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── Strip 1 — gradient header overlay ── */}
        <div style={{ height: FIRST_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {/* Background image */}
          {cards[0].img
            ? <img src={cards[0].img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 80, display: "flex" }}>🍽️</div>
              </div>
          }
          {/* Top gradient (header area) */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "78%", background: "linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)", display: "flex" }} />
          {/* Bottom gradient (recipe info) */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)", display: "flex" }} />

          {/* Header text — ortalı, y≥215 (Instagram safe zone altı) */}
          <div style={{ position: "absolute", top: 215, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ color: "#FCD34D", fontSize: 24, letterSpacing: 1, display: "flex" }}>{date}</div>
            <div style={{ color: "#FFFFFF", fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>Günün Menüsü</div>
          </div>

          {/* Recipe info — bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 26px 28px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#FCD34D", fontSize: 22, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[0].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[0].title}</div>
            {cards[0].author && (
              <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 19, display: "flex" }}>Yazar: {cards[0].author}</div>
            )}
          </div>
        </div>

        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

        {/* ── Strip 2: Ana Yemek — sağ üst ── */}
        <div style={{ height: OTHER_H, display: "flex", flexShrink: 0, overflow: "hidden" }}>
          <ImageCell card={cards[1]} fontSize={28} authorPrefix textPosition="top-right" />
        </div>
        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
        {/* ── Strip 3: Yardımcı Lezzet — sol üst ── */}
        <div style={{ height: OTHER_H, display: "flex", flexShrink: 0, overflow: "hidden" }}>
          <ImageCell card={cards[2]} fontSize={28} authorPrefix textPosition="top-left" />
        </div>
        <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
        {/* ── Strip 4: Tatlı — sağ üst ── */}
        <div style={{ height: OTHER_H, display: "flex", flexShrink: 0, overflow: "hidden" }}>
          <ImageCell card={cards[3]} fontSize={28} authorPrefix textPosition="top-right" />
        </div>

      </div>

      {/* Right amber border */}
      <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      {/* Alt karartı — URL ve slogan okunabilsin */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 320, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)", display: "flex" }} />

      {/* Site URL + slogan — en son render → şeritlerin üstünde; reply bar (~150px) kapatmaz */}
      <div style={{ position: "absolute", bottom: 162, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, fontWeight: 700, letterSpacing: 2, display: "flex" }}>www.menugunlugu.com</div>
        <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: 1.8, display: "flex" }}>TARİFİNİ YÜKLE &amp; TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!</div>
      </div>

    </div>
  );
}
