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
  amber:   "#d97706",
  amberD:  "#92400e",
  amberL:  "#FFF8F1",
  amberM:  "#fde68a",
  cream:   "#FFFCF8",
  text:    "#1c1917",
  textMid: "#57534e",
  muted:   "#a8a29e",
  white:   "#ffffff",
  gold:    "#f59e0b",
};

const SLOTS = [
  { key: "soup"    as const, cat: "Çorba" },
  { key: "main"    as const, cat: "Ana Yemek" },
  { key: "side"    as const, cat: "Yardımcı Lezzet" },
  { key: "dessert" as const, cat: "Tatlı" },
];

type Key = "soup" | "main" | "side" | "dessert";
interface Card { title: string; author: string; cat: string; img: string | null }

/* ── Node fetch + sharp (same as PDF route) ──────────────────── */
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
  const W = 1080, H = isStory ? 1920 : 1350;

  return new ImageResponse(
    isStory ? <StoryView cards={cards} date={dateStr} /> : <PostView cards={cards} date={dateStr} />,
    { width: W, height: H, fonts: [
      { name: "Roboto", data: fontR, weight: 400, style: "normal" },
      { name: "Roboto", data: fontB, weight: 700, style: "normal" },
    ]}
  );
}

/* ── Post layout · 1080 × 1350 ──────────────────────────────── */
/*  Cream bg, 2×2 card grid, image top + text bottom per card   */
function PostView({ cards, date }: { cards: Card[]; date: string }) {
  const PAD  = 28;
  const GAP  = 14;
  const HEAD = 148;
  const FOOT = 52;
  // card height = (1350 - HEAD - FOOT - PAD*2 - GAP) / 2
  const CARD_H = Math.floor((1350 - HEAD - FOOT - PAD * 2 - GAP) / 2); // 520
  const CARD_W = Math.floor((1080 - PAD * 2 - GAP) / 2);               // 505
  const IMG_H  = Math.floor(CARD_H * 0.62);                             // ~322
  const INFO_H = CARD_H - IMG_H;                                        // ~198

  function PostCard({ card, idx }: { card: Card; idx: number }) {
    return (
      <div style={{ width: CARD_W, height: CARD_H, display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden", border: `1px solid ${C.amberM}` }}>
        {/* Image */}
        <div style={{ width: CARD_W, height: IMG_H, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
          {card.img
            ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.amberM, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 56, display: "flex" }}>🍽️</div>
              </div>
          }
          {/* Category pill */}
          <div style={{ position: "absolute", top: 12, left: 12, backgroundColor: C.amber, borderRadius: 100, paddingTop: 5, paddingBottom: 5, paddingLeft: 12, paddingRight: 12, display: "flex" }}>
            <div style={{ color: C.white, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, fontFamily: "Roboto", display: "flex" }}>{card.cat.toUpperCase()}</div>
          </div>
        </div>
        {/* Info */}
        <div style={{ flex: 1, backgroundColor: C.white, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
          <div style={{ color: C.text, fontSize: 19, fontWeight: 700, lineHeight: 1.2, fontFamily: "Roboto", display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ color: C.muted, fontSize: 12, fontFamily: "Roboto", display: "flex" }}>
              Yazar: <span style={{ color: C.amber, marginLeft: 4, fontWeight: 700, display: "flex" }}>{card.author}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 1080, height: 1350, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.amberL }}>
      {/* Top accent */}
      <div style={{ height: 5, display: "flex", background: `linear-gradient(90deg, ${C.amberD} 0%, ${C.amber} 50%, ${C.gold} 100%)` }} />

      {/* Header */}
      <div style={{ height: HEAD - 5, backgroundColor: C.amberL, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD + 4}px` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ color: C.amber, fontSize: 13, fontWeight: 700, letterSpacing: 3, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
          <div style={{ color: C.text, fontSize: 36, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        </div>
        <div style={{ color: C.textMid, fontSize: 14, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{ display: "flex" }}>{date.split(" ").slice(0, 2).join(" ")}</div>
          <div style={{ display: "flex" }}>{date.split(" ").slice(2).join(" ")}</div>
        </div>
      </div>

      {/* 2×2 grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: `0 ${PAD}px`, gap: GAP, justifyContent: "center" }}>
        <div style={{ display: "flex", gap: GAP }}>
          <PostCard card={cards[0]} idx={0} />
          <PostCard card={cards[1]} idx={1} />
        </div>
        <div style={{ display: "flex", gap: GAP }}>
          <PostCard card={cards[2]} idx={2} />
          <PostCard card={cards[3]} idx={3} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: FOOT, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ color: C.amberM, fontSize: 13, fontWeight: 700, letterSpacing: 2, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
        <div style={{ color: "rgba(253,230,138,0.4)", fontSize: 12, display: "flex" }}>·</div>
        <div style={{ color: C.amberL, fontSize: 13, display: "flex" }}>menugunlugu.com</div>
      </div>
    </div>
  );
}

/* ── Story layout · 1080 × 1920 ─────────────────────────────── */
/*  Split card: cream text on left, image on right               */
function StoryView({ cards, date }: { cards: Card[]; date: string }) {
  const HEAD  = 188;
  const FOOT  = 52;
  const STRIP = Math.floor((1920 - HEAD - FOOT) / 4); // 420

  function Strip({ card, idx }: { card: Card; idx: number }) {
    const isEven = idx % 2 === 0;
    const txtW = 520, imgW = 1080 - txtW;

    const TextSide = () => (
      <div style={{ width: txtW, height: STRIP, backgroundColor: idx === 0 ? C.cream : C.amberL, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 44px", gap: 8 }}>
        <div style={{ color: C.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: C.text, fontSize: 28, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ color: C.muted, fontSize: 13, display: "flex" }}>Yazar:</div>
            <div style={{ color: C.amber, fontSize: 13, fontWeight: 700, display: "flex" }}>{card.author}</div>
          </div>
        )}
      </div>
    );

    const ImgSide = () => (
      <div style={{ width: imgW, height: STRIP, position: "relative", display: "flex", overflow: "hidden", flexShrink: 0 }}>
        {card.img
          ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.amberM, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 60, display: "flex" }}>🍽️</div>
            </div>
        }
      </div>
    );

    return (
      <div style={{ display: "flex", height: STRIP, flexShrink: 0, borderBottom: idx < 3 ? `1px solid ${C.amberM}` : "none" }}>
        {isEven ? <><TextSide /><ImgSide /></> : <><ImgSide /><TextSide /></>}
      </div>
    );
  }

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.cream }}>
      {/* Top accent */}
      <div style={{ height: 5, display: "flex", background: `linear-gradient(90deg, ${C.amberD} 0%, ${C.amber} 50%, ${C.gold} 100%)` }} />

      {/* Header */}
      <div style={{ height: HEAD - 5, backgroundColor: C.amber, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", gap: 6 }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 400, letterSpacing: 4, display: "flex" }}>MENÜ GÜNLÜĞÜ · menugunlugu.com</div>
        <div style={{ color: C.white, fontSize: 52, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        <div style={{ color: C.amberM, fontSize: 17, display: "flex" }}>{date}</div>
      </div>

      {/* 4 strips */}
      {cards.map((card, i) => <Strip key={i} card={card} idx={i} />)}

      {/* Footer */}
      <div style={{ height: FOOT, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ color: C.amberM, fontSize: 13, fontWeight: 700, letterSpacing: 2, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
        <div style={{ color: "rgba(253,230,138,0.4)", fontSize: 12, display: "flex" }}>·</div>
        <div style={{ color: C.amberL, fontSize: 13, display: "flex" }}>menugunlugu.com</div>
      </div>
    </div>
  );
}
