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
interface Card { id: string; title: string; author: string; cat: string; img: string | null; ingredients: string[]; steps: string[] }

function parseIngredients(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  // ":" ile bitenler bölüm başlığı — bunları koru (bold render edilecek)
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
}

function parseSteps(html: string): string[] {
  const text = html
    .replace(/<\/li>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<");
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 6);
}

// Sağ panelde bir malzeme satırının yaklaşık piksel yüksekliği
// ":"nin ilk 20 karakterde olması → bölüm başlığı (ör. "Servisi için:", "Hamuru için:")
function ingHeaderIdx(item: string): number {
  const i = item.indexOf(":");
  return i > 1 && i <= 20 ? i : -1;
}
function estIngH(item: string): number {
  if (item.endsWith(":")) return 26; // sadece başlık — tek satır
  const ci = ingHeaderIdx(item);
  if (ci !== -1) {
    // "Servisi için:Lavaş tortilla ekmeği" → başlık + malzeme satırı
    const rest = item.slice(ci + 1).trim();
    const restLines = Math.max(1, Math.ceil(rest.length / 46));
    return 26 + restLines * 21 + 5;
  }
  const lines = Math.max(1, Math.ceil(item.length / 46));
  return lines * 21 + 5;
}

// Sağ panelde bir hazırlanış adımının yaklaşık piksel yüksekliği
// Panel content width: 520 - 32(pad) = 488 → number(17) + gap(6) = 465px text area
// Roboto 16px: avg char ≈ 7.4px (boşluk dahil) → 465/7.4 ≈ 62 char/satır
function estStepH(step: string): number {
  const lines = Math.max(1, Math.ceil(step.length / 62));
  return lines * 21 + 6; // fontSize 16 * lineHeight 1.3 = 20.8px + gap 6
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
    cards.push({ id: r?.id ?? "", title: r?.title ?? "—", author, cat: s.cat, img, ingredients, steps });
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
  catFontSize = 26,
  authorFontSize = 19,
  authorPrefix = false,
  textPosition = "bottom",
  bottomPad = 28,
  textGap = 5,
}: {
  card: Card;
  fontSize?: number;
  catFontSize?: number;
  authorFontSize?: number;
  authorPrefix?: boolean;
  textPosition?: "bottom" | "top-left" | "top-right";
  bottomPad?: number;
  textGap?: number;
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
        ...(isTop ? { top: 0 } : { bottom: bottomPad }),
        ...(isRight ? { right: 0 } : { left: 0 }),
        padding: "0 26px",
        display: "flex",
        flexDirection: "column",
        alignItems: isRight ? "flex-end" : "flex-start",
        gap: textGap,
        maxWidth: "90%",
      }}>
        <div style={{ color: "#FCD34D", fontSize: catFontSize, fontWeight: 700, letterSpacing: 2.2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: authorFontSize, display: "flex" }}>
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
    <div style={{ height: 130, backgroundColor: "#92400E", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 28px", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20 }}>
        <div style={{ color: "#FFFFFF", fontSize: 42, fontWeight: 700, lineHeight: 1, display: "flex" }}>Günün Menüsü</div>
        <div style={{ width: 2, height: 40, backgroundColor: "rgba(255,255,255,0.3)", display: "flex" }} />
        <div style={{ color: "#FFFFFF", fontSize: 24, display: "flex" }}>{date}</div>
      </div>
    </div>
  );
}

function SharedFooter() {
  return (
    <div style={{ height: 130, backgroundColor: "#92400E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#FCD34D", display: "flex" }} />
        <div style={{ color: "#FEF3E2", fontSize: 18, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>MENUGUNLUGU.COM</div>
        <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#FCD34D", display: "flex" }} />
      </div>
      <div style={{ color: "#FFFFFF", fontSize: 14, letterSpacing: 1.5, display: "flex" }}>TARİFİNİ YÜKLE &amp; TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!</div>
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
  const PANEL_W = 520; // sayfanın ortasına (~540) yakın şeffaf alan

  // ── Overflow sınırı: sol "Yazar:" etiketi hizasına kadar ────────
  // Content area: 1440 - 130(header) - 3 - 130(footer) - 3 = 1174px
  // Sol overlay: bottom=90 → alt kenar = 1174-90 = 1084px
  // "Detaylar için" satırı kaldırıldı → Yazar: artık son satır
  // Yazar üstü = 1084 - 19 = 1065px
  // Sağ panel: top pad 20px + link bloğu rezervi 62px
  const CONTENT_AREA_H = 1440 - 130 - 3 - 130 - 3;   // 1174
  const OVERLAY_BOTTOM = CONTENT_AREA_H - 90;           // 1084
  const YAZAR_TOP      = OVERLAY_BOTTOM - 19;            // 1065
  const LINK_H         = 62;                             // link bloğu: separator+padding+iki satır
  const MAX_CONTENT_H  = YAZAR_TOP - 20 - LINK_H;       // 983

  const ING_HEADER_H  = 30;  // "MALZEMELER" + divider
  const STEP_HEADER_H = 44;  // separator + "HAZIRLANIŞ" + divider

  // Malzemelerin tamamı her zaman gösterilir
  const visibleIngs = card.ingredients;

  // Yapılış adımları yazar hizasına kadar sığanlar kadar gösterilir
  let usedH = ING_HEADER_H + visibleIngs.reduce((s, i) => s + estIngH(i), 0);
  const visibleSteps: string[] = [];
  if (card.steps.length > 0) {
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

  // link her zaman gösterilecek — hasOverflow artık kullanılmıyor

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

        {/* Sol-alt: kategori · başlık · yazar */}
        <div style={{ position: "absolute", bottom: 90, left: 0, right: PANEL_W, padding: "0 28px", display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ color: "#FCD34D", fontSize: 22, fontWeight: 700, letterSpacing: 2.5, display: "flex" }}>{card.cat.toUpperCase()}</div>
          <div style={{ color: "#FFFFFF", fontSize: 39, fontWeight: 700, lineHeight: 1.15, display: "flex" }}>{card.title}</div>
          {card.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 19, display: "flex" }}>Yazar:</div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 19, fontWeight: 700, display: "flex" }}>{card.author}</div>
            </div>
          )}
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
          <div style={{ color: "#FCD34D", fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>MALZEMELER</div>
          <div style={{ height: 1, backgroundColor: "#D97706", display: "flex", marginBottom: 9 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {visibleIngs.map((item, i) => {
              // "Hamuru için:" — sadece başlık
              if (item.endsWith(":")) {
                return <div key={i} style={{ color: "#FCD34D", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{item}</div>;
              }
              // "Servisi için:Lavaş tortilla ekmeği" — başlık + malzeme
              const ci = ingHeaderIdx(item);
              if (ci !== -1) {
                const header = item.slice(0, ci + 1); // "Servisi için:"
                const rest   = item.slice(ci + 1).trim(); // "Lavaş tortilla ekmeği"
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ color: "#FCD34D", fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, display: "flex" }}>{header}</div>
                    {rest && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#D97706", marginTop: 6, flexShrink: 0, display: "flex" }} />
                        <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15.5, lineHeight: 1.25, display: "flex" }}>{rest}</div>
                      </div>
                    )}
                  </div>
                );
              }
              // Normal malzeme
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#D97706", marginTop: 6, flexShrink: 0, display: "flex" }} />
                  <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 15.5, lineHeight: 1.25, display: "flex" }}>{item}</div>
                </div>
              );
            })}
          </div>

          {/* HAZIRLANIŞ */}
          {visibleSteps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.18)", display: "flex", margin: "10px 0 8px" }} />
              <div style={{ color: "#FCD34D", fontSize: 12, fontWeight: 700, letterSpacing: 2, display: "flex", marginBottom: 7 }}>HAZIRLANIŞ</div>
              <div style={{ height: 1, backgroundColor: "#D97706", display: "flex", marginBottom: 9 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visibleSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ minWidth: 17, height: 17, borderRadius: 2, backgroundColor: "rgba(217,119,6,0.75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <div style={{ color: "#FFF", fontSize: 10, fontWeight: 700, display: "flex" }}>{i + 1}</div>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 16, lineHeight: 1.3, display: "flex" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link — absolute, sol "Yazar:" etiketiyle hizalı (bottom: 90) */}
          <div style={{ position: "absolute", bottom: 90, left: 16, right: 16, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, display: "flex" }}>Tarifin tamamına ulaşmak ve daha fazla içerik için:</div>
            <div style={{ color: "#FCD34D", fontSize: 17, fontWeight: 700, display: "flex" }}>menugunlugu.com</div>
          </div>

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
  const HEAD = 130;
  const FOOT = 130;
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
            <ImageCell card={cards[0]} fontSize={23} catFontSize={29} authorFontSize={22} authorPrefix bottomPad={46} textGap={8} />
            <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
            <ImageCell card={cards[1]} fontSize={23} catFontSize={29} authorFontSize={22} authorPrefix bottomPad={46} textGap={8} />
          </div>
          {/* Row divider */}
          <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
          {/* Row 2 */}
          <div style={{ flex: 1, display: "flex" }}>
            <ImageCell card={cards[2]} fontSize={23} catFontSize={29} authorFontSize={22} authorPrefix bottomPad={46} textGap={8} />
            <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
            <ImageCell card={cards[3]} fontSize={23} catFontSize={29} authorFontSize={22} authorPrefix bottomPad={46} textGap={8} />
          </div>
        </div>
        {/* Right amber border */}
        <div style={{ width: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />
      </div>

      {/* Bottom amber line */}
      <div style={{ height: DIV, backgroundColor: "#D97706", flexShrink: 0, display: "flex" }} />

      <SharedFooter />

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STORY  1080 × 1920
   Kart tasarımı — sabit kahve rengi (#92400E)
════════════════════════════════════════════════════════════════ */
function StoryCardKarti({ card, align }: { card: Card; align: "left" | "right" }) {
  return (
    <div style={{
      flex: 1,
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      display: "flex",
      border: "3px solid #FCD34D80",
    }}>
      {card.img
        ? <img src={card.img} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#C8A97A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 50, display: "flex" }}>🍽️</div>
          </div>
      }
      {/* Bottom gradient */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "72%", background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 52%, transparent 100%)", display: "flex" }} />
      {/* Text overlay */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingLeft: 20, paddingRight: 20, paddingBottom: 28,
        display: "flex", flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: 5,
      }}>
        <div style={{ color: "#FCD34D", fontSize: 20, fontWeight: 700, letterSpacing: 2, display: "flex" }}>{card.cat.toUpperCase()}</div>
        <div style={{ color: "#FFFFFF", fontSize: 29, fontWeight: 700, lineHeight: 1.2, display: "flex" }}>{card.title}</div>
        {card.author && (
          <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 20, display: "flex" }}>Yazar: {card.author}</div>
        )}
      </div>
    </div>
  );
}

function StoryView({ cards, date }: { cards: Card[]; date: string }) {
  const PAD_H  = 44;
  const CARD_G = 16;
  const ROW_H  = 550;

  return (
    <div style={{ width: 1080, height: 1920, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#92400E" }}>

      {/* Instagram safe zone */}
      <div style={{ height: 240, flexShrink: 0, display: "flex" }} />

      {/* Tarih */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ color: "#FCD34D", fontSize: 24, letterSpacing: 1.5, display: "flex" }}>{date}</div>
      </div>

      <div style={{ height: 12, flexShrink: 0, display: "flex" }} />

      {/* Başlık */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ color: "#FFFFFF", fontSize: 60, fontWeight: 700, lineHeight: 1, display: "flex" }}>Günün Menüsü</div>
      </div>

      <div style={{ height: 56, flexShrink: 0, display: "flex" }} />

      {/* Üst sıra: Çorba | Ana Yemek */}
      <div style={{ height: ROW_H, paddingLeft: PAD_H, paddingRight: PAD_H, display: "flex", gap: CARD_G, flexShrink: 0 }}>
        <StoryCardKarti card={cards[0]} align="left" />
        <StoryCardKarti card={cards[1]} align="right" />
      </div>

      <div style={{ height: 16, flexShrink: 0, display: "flex" }} />

      {/* Alt sıra: Yardımcı Lezzet | Tatlı */}
      <div style={{ height: ROW_H, paddingLeft: PAD_H, paddingRight: PAD_H, display: "flex", gap: CARD_G, flexShrink: 0 }}>
        <StoryCardKarti card={cards[2]} align="left" />
        <StoryCardKarti card={cards[3]} align="right" />
      </div>

      {/* Kartlar → Link arası boşluk */}
      <div style={{ height: 52, flexShrink: 0, display: "flex" }} />

      {/* Link kutusu */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{
          borderRadius: 999,
          border: "2px solid #FCD34D",
          paddingLeft: 40, paddingRight: 40, paddingTop: 14, paddingBottom: 14,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ color: "#FCD34D", fontSize: 22, display: "flex" }}>🔗</div>
          <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 700, letterSpacing: 1.2, display: "flex" }}>menugunlugu.com</div>
        </div>
      </div>

      {/* URL → Slogan arası boşluk */}
      <div style={{ height: 36, flexShrink: 0, display: "flex" }} />

      {/* Slogan */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
        <div style={{ color: "#FEF3E2", fontSize: 13, letterSpacing: 1.5, display: "flex" }}>TARİFİNİ YÜKLE &amp; TARİFLERE GÖZ AT · MENÜ OLUŞTUR · PAYLAŞ!</div>
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FCD34D", display: "flex" }} />
      </div>

      {/* Alt boşluk — Instagram reply bar */}
      <div style={{ flex: 1, display: "flex" }} />
    </div>
  );
}
