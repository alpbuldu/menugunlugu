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

/* ── Colors ──────────────────────────────────────────────────── */
const C = {
  amber:  "#d97706",
  amberD: "#92400e",
  amberL: "#fef3e2",
  amberM: "#fde68a",
  gold:   "#fbbf24",
  bgDark: "#0f0500",
};

const SLOTS = [
  { key: "soup"    as const, cat: "ÇORBA" },
  { key: "main"    as const, cat: "ANA YEMEK" },
  { key: "side"    as const, cat: "YARDIMCI LEZZET" },
  { key: "dessert" as const, cat: "TATLI" },
];

type Key = "soup" | "main" | "side" | "dessert";
interface Card { title: string; author: string; cat: string; img: string | null }

/* ── Image fetching (same as PDF route) ──────────────────────── */
function nodeGet(url: string, hops = 5): Promise<Buffer | null> {
  return new Promise(resolve => {
    if (hops < 0) return resolve(null);
    let done = false;
    const fin = (v: Buffer | null) => { if (!done) { done = true; resolve(v); } };
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { "User-Agent": "menugunlugu/1.0" } }, res => {
      if (res.statusCode && [301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        nodeGet(res.headers.location, hops - 1).then(fin);
        return;
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
    try { const j = await sharp(buf).jpeg({ quality: 88 }).toBuffer(); return `data:image/jpeg;base64,${j.toString("base64")}`; }
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

  if (Object.values(ids).some(v => !v)) {
    return new Response("4 IDs required", { status: 400 });
  }

  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("recipes")
    .select("id, title, image_url, submitted_by")
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

  /* Build cards + fetch images sequentially */
  const cards: Card[] = [];
  for (const s of SLOTS) {
    const r = byId[ids[s.key]];
    const isAdmin = !r?.submitted_by;
    const author = isAdmin ? adminName : (profileMap[r?.submitted_by!] ?? "");
    const img = await getImg(r?.image_url ?? null);
    cards.push({ title: r?.title ?? "—", author, cat: s.cat, img });
  }

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const fontR = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf"));
  const fontB = readFileSync(path.join(process.cwd(), "public", "fonts", "Roboto-Medium.ttf"));

  const W = 1080;
  const H = isStory ? 1920 : 1350;

  return new ImageResponse(
    isStory
      ? <StoryView cards={cards} date={dateStr} />
      : <PostView  cards={cards} date={dateStr} />,
    {
      width: W, height: H,
      fonts: [
        { name: "Roboto", data: fontR, weight: 400, style: "normal" },
        { name: "Roboto", data: fontB, weight: 700, style: "normal" },
      ],
    }
  );
}

/* ── Shared image cell ───────────────────────────────────────── */
function Cell({ img, cat, title, author, textSize = 22 }: {
  img: string | null; cat: string; title: string; author: string; textSize?: number;
}) {
  return (
    <div style={{ position: "relative", display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Background image or placeholder */}
      {img
        ? <img src={img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.amberM, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 72, display: "flex" }}>🍽️</div>
          </div>
      }
      {/* Dark gradient bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "68%", background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, transparent 100%)", display: "flex" }} />
      {/* Text */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 24px 22px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{cat}</div>
        <div style={{ color: "#ffffff", fontSize: textSize, fontWeight: 700, lineHeight: 1.25, display: "flex" }}>{title}</div>
        {author && <div style={{ color: "#d1d5db", fontSize: 13, display: "flex" }}>{author}</div>}
      </div>
    </div>
  );
}

/* ── Post layout 1080×1350 ───────────────────────────────────── */
function PostView({ cards, date }: { cards: Card[]; date: string }) {
  return (
    <div style={{ width: 1080, height: 1350, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.bgDark }}>

      {/* Header */}
      <div style={{ height: 158, backgroundColor: C.amber, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 52px", gap: 4 }}>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 400, letterSpacing: 4, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
        <div style={{ color: "#ffffff", fontSize: 46, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        <div style={{ color: C.amberM, fontSize: 15, display: "flex" }}>{date}</div>
      </div>
      <div style={{ height: 4, backgroundColor: C.amberD, display: "flex" }} />

      {/* 2×2 Grid */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        {/* Row 1 */}
        <div style={{ display: "flex", flex: 1 }}>
          <Cell {...cards[0]} textSize={20} />
          <div style={{ width: 3, backgroundColor: C.amber, display: "flex", flexShrink: 0 }} />
          <Cell {...cards[1]} textSize={20} />
        </div>
        <div style={{ height: 3, backgroundColor: C.amber, display: "flex" }} />
        {/* Row 2 */}
        <div style={{ display: "flex", flex: 1 }}>
          <Cell {...cards[2]} textSize={20} />
          <div style={{ width: 3, backgroundColor: C.amber, display: "flex", flexShrink: 0 }} />
          <Cell {...cards[3]} textSize={20} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 56, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.amberL, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, display: "flex" }}>menugunlugu.com</div>
      </div>

    </div>
  );
}

/* ── Story layout 1080×1920 ──────────────────────────────────── */
function StoryView({ cards, date }: { cards: Card[]; date: string }) {
  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: C.bgDark }}>

      {/* Header */}
      <div style={{ height: 200, backgroundColor: C.amber, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px", gap: 6 }}>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 400, letterSpacing: 4, display: "flex" }}>MENÜ GÜNLÜĞÜ</div>
        <div style={{ color: "#ffffff", fontSize: 52, fontWeight: 700, display: "flex" }}>Günün Menüsü</div>
        <div style={{ color: C.amberM, fontSize: 18, display: "flex" }}>{date}</div>
      </div>
      <div style={{ height: 4, backgroundColor: C.amberD, display: "flex" }} />

      {/* 4 strips */}
      {cards.map((card, i) => (
        <div key={i} style={{ position: "relative", display: "flex", flex: 1, overflow: "hidden" }}>
          {card.img
            ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: i % 2 === 0 ? C.amberM : "#fef3e2", display: "flex" }} />
          }
          {/* Left-side gradient for text readability */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 42%, transparent 68%)", display: "flex" }} />
          {/* Text on left */}
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "58%", padding: "0 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 7 }}>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{card.cat}</div>
            <div style={{ color: "#ffffff", fontSize: 34, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
            {card.author && <div style={{ color: "#d1d5db", fontSize: 17, display: "flex" }}>{card.author}</div>}
          </div>
          {/* Subtle divider */}
          {i < 3 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(217,119,6,0.4)", display: "flex" }} />}
        </div>
      ))}

      {/* Footer */}
      <div style={{ height: 56, backgroundColor: C.amberD, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.amberL, fontSize: 19, fontWeight: 700, letterSpacing: 1.5, display: "flex" }}>menugunlugu.com</div>
      </div>

    </div>
  );
}
