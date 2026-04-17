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

/* ── Palette ─────────────────────────────────────────────────── */
const C = {
  sand:    "#F5F0E8",   // warm background
  cream:   "#FAFAF8",   // lighter variant
  white:   "#FFFFFF",
  border:  "#EAD9C0",   // warm card border
  amber:   "#D97706",
  amberD:  "#92400E",
  amberSoft: "#F5E6CC", // soft amber for pills
  text:    "#1C1917",
  mid:     "#57534E",
  muted:   "#A8A29E",
  gold:    "#F59E0B",
};

const SLOTS = [
  { key: "soup"    as const, cat: "Çorba" },
  { key: "main"    as const, cat: "Ana Yemek" },
  { key: "side"    as const, cat: "Yardımcı Lezzet" },
  { key: "dessert" as const, cat: "Tatlı" },
];

type Key = "soup" | "main" | "side" | "dessert";
interface Card { title: string; author: string; cat: string; img: string | null }

/* ── Image fetch + WebP→JPEG ─────────────────────────────────── */
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

/* ════════════════════════════════════════════════════════════════
   POST  1080 × 1350
   Warm sand bg · 2×2 white cards · image top · text bottom
════════════════════════════════════════════════════════════════ */
function PostView({ cards, date }: { cards: Card[]; date: string }) {
  const PAD = 24;
  const GAP = 12;
  const HEAD = 136;
  const FOOT = 56;
  const CARD_W = Math.floor((1080 - PAD * 2 - GAP) / 2);      // 510
  const ROW_H  = Math.floor((1350 - HEAD - FOOT - PAD * 2 - GAP) / 2); // ~519
  const IMG_H  = Math.floor(ROW_H * 0.63);                      // ~327
  const TXT_H  = ROW_H - IMG_H;                                 // ~192

  function Card({ card }: { card: Card }) {
    return (
      <div style={{ width: CARD_W, height: ROW_H, display: "flex", flexDirection: "column", backgroundColor: C.white, borderRadius: 20, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
        {/* Image */}
        <div style={{ width: CARD_W, height: IMG_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {card.img
            ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 52, display: "flex" }}>🍽️</div>
              </div>
          }
          {/* Soft category pill */}
          <div style={{ position: "absolute", top: 14, left: 14, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 100, paddingTop: 5, paddingBottom: 5, paddingLeft: 13, paddingRight: 13, display: "flex" }}>
            <div style={{ color: C.amber, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, display: "flex" }}>{card.cat.toUpperCase()}</div>
          </div>
        </div>
        {/* Text */}
        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7 }}>
          <div style={{ color: C.text, fontSize: 19, fontWeight: 700, lineHeight: 1.25, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: C.amber, flexShrink: 0, display: "flex" }} />
              <div style={{ color: C.muted, fontSize: 13, display: "flex" }}>{card.author}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 1080, height: 1350, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.sand }}>
      {/* Top amber stripe */}
      <div style={{ height: 5, display: "flex", background: `linear-gradient(90deg, ${C.amberD}, ${C.amber}, ${C.gold})` }} />

      {/* Header */}
      <div style={{ height: HEAD - 5, backgroundColor: C.sand, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD + 2}px` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ color: C.amber, fontSize: 11, fontWeight: 700, letterSpacing: 3.5, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
          <div style={{ color: C.text, fontSize: 38, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <div style={{ color: C.mid, fontSize: 13, display: "flex" }}>{date.split(",")[0]}</div>
          <div style={{ color: C.muted, fontSize: 12, display: "flex" }}>menugunlugu.com</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: `0 ${PAD}px`, gap: GAP, justifyContent: "center" }}>
        <div style={{ display: "flex", gap: GAP }}>
          <Card card={cards[0]} />
          <Card card={cards[1]} />
        </div>
        <div style={{ display: "flex", gap: GAP }}>
          <Card card={cards[2]} />
          <Card card={cards[3]} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: FOOT, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, display: "flex" }} />
        <div style={{ color: "#FEF3E2", fontSize: 14, fontWeight: 700, letterSpacing: 2, display: "flex" }}>MENUGUNLUGU.COM</div>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, display: "flex" }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STORY  1080 × 1920
   4 strips: full-bleed image top · clean text bar bottom
════════════════════════════════════════════════════════════════ */
function StoryView({ cards, date }: { cards: Card[]; date: string }) {
  const HEAD   = 192;
  const FOOT   = 56;
  const STRIP  = Math.floor((1920 - HEAD - FOOT) / 4); // 418
  const IMG_H  = Math.floor(STRIP * 0.63);              // 263
  const TXT_H  = STRIP - IMG_H;                         // 155

  function Strip({ card, idx }: { card: Card; idx: number }) {
    const bg = idx % 2 === 0 ? C.white : C.cream;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: STRIP, flexShrink: 0 }}>
        {/* Image */}
        <div style={{ width: 1080, height: IMG_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {card.img
            ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 64, display: "flex" }}>🍽️</div>
              </div>
          }
        </div>
        {/* Text bar */}
        <div style={{ height: TXT_H, backgroundColor: bg, borderBottom: `1px solid ${C.border}`, padding: "0 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ color: C.amber, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{card.cat.toUpperCase()}</div>
          <div style={{ color: C.text, fontSize: 26, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: C.amber, flexShrink: 0, display: "flex" }} />
              <div style={{ color: C.muted, fontSize: 13, display: "flex" }}>{card.author}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.sand }}>
      {/* Top stripe */}
      <div style={{ height: 5, display: "flex", background: `linear-gradient(90deg, ${C.amberD}, ${C.amber}, ${C.gold})` }} />

      {/* Header */}
      <div style={{ height: HEAD - 5, backgroundColor: C.amber, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 52px", gap: 6 }}>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, letterSpacing: 4, display: "flex" }}>MENÜ GÜNLÜĞÜ · menugunlugu.com</div>
        <div style={{ color: C.white, fontSize: 50, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, display: "flex" }}>{date}</div>
      </div>

      {/* 4 strips */}
      {cards.map((card, i) => <Strip key={i} card={card} idx={i} />)}

      {/* Footer */}
      <div style={{ height: FOOT, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, display: "flex" }} />
        <div style={{ color: "#FEF3E2", fontSize: 14, fontWeight: 700, letterSpacing: 2, display: "flex" }}>MENUGUNLUGU.COM</div>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, display: "flex" }} />
      </div>
    </div>
  );
}
