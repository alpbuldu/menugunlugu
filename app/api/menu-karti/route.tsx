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
interface Card { title: string; author: string; cat: string; img: string | null }

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
  const isStory = searchParams.get("format") === "story";

  const ids: Record<Key, string> = {
    soup:    searchParams.get("soup")    ?? "",
    main:    searchParams.get("main")    ?? "",
    side:    searchParams.get("side")    ?? "",
    dessert: searchParams.get("dessert") ?? "",
  };
  if (Object.values(ids).some(v => !v)) return new Response("4 IDs required", { status: 400 });

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("recipes").select("id, title, image_url, submitted_by")
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
    cards.push({ title: r?.title ?? "—", author, cat: s.cat, img });
  }

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const fontR = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf"));
  const fontB = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Medium.ttf"));

  return new ImageResponse(
    isStory ? <StoryView cards={cards} date={dateStr} /> : <PostView cards={cards} date={dateStr} />,
    {
      width: 1080, height: isStory ? 1920 : 1350,
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
        padding: "14px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: isRight ? "flex-end" : "flex-start",
        gap: 5,
        maxWidth: "85%",
      }}>
        <div style={{ color: "#FCD34D", fontSize: 13, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 15, display: "flex" }}>
            {authorPrefix ? `Yazar: ${card.author}` : card.author}
          </div>
        )}
      </div>
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
    <div style={{ width: 1080, height: 1350, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

      {/* Header — dark strip, same color as footer */}
      <div style={{ height: HEAD, backgroundColor: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ color: "#FCD34D", fontSize: 12, display: "flex" }}>{date}</div>
          <div style={{ color: "#FEF3E2", fontSize: 33, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
          {/* Website */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FEF3E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <div style={{ color: "#FEF3E2", fontSize: 13, fontWeight: 700, display: "flex" }}>menugunlugu.com</div>
          </div>
          {/* Instagram */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.8" fill="#FCD34D" stroke="none"/>
            </svg>
            <div style={{ color: "#FCD34D", fontSize: 13, fontWeight: 700, display: "flex" }}>@menugunlugu</div>
          </div>
        </div>
      </div>

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
    <div style={{ width: 1080, height: 1920, display: "flex", fontFamily: "Roboto", backgroundColor: "#0A0400" }}>

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
            <div style={{ color: "#FCD34D", fontSize: 17, letterSpacing: 1, display: "flex" }}>{date}</div>
            <div style={{ color: "#FFFFFF", fontSize: 58, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>Günün Menüsü</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, display: "flex" }}>menugunlugu.com</div>
          </div>

          {/* Recipe info — bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 22px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#FCD34D", fontSize: 13, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{cards[0].cat.toUpperCase()}</div>
            <div style={{ color: "#FFFFFF", fontSize: 30, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{cards[0].title}</div>
            {cards[0].author && (
              <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 15, display: "flex" }}>Yazar: {cards[0].author}</div>
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

    </div>
  );
}
