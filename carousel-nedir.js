/**
 * Menü Günlüğü — Platform Tanıtım Carousel (v4)
 * 1080 × 1350  (Instagram portrait 4:5)
 * v4: PDF tanıtım içeriğiyle tam eşleşme, 13 slayt
 *     Kapakta logo arka planı yok, başlıklar çerçeveli
 * Çalıştır: node carousel-nedir.js
 */

const satori    = require("satori").default;
const { Resvg } = require("@resvg/resvg-js");
const { readFileSync, mkdirSync, writeFileSync } = require("fs");
const path      = require("path");
const sharp     = require("sharp");
const https     = require("https");
const http      = require("http");

const W     = 1080;
const H     = 1350;
const TOTAL = 13;

// ── Renkler ────────────────────────────────────────────────────
const BROWN   = "#92400E";
const AMBER   = "#D97706";
const ORANGE  = "#E07A2F";
const CREAM   = "#FDF0E6";
const CREAMS  = "#FAF0E2";
const WHITE   = "#FFFFFF";
const YELLOW  = "#FCD34D";
const MUTED   = "rgba(253,240,230,0.70)";
const CBG     = "rgba(0,0,0,0.76)";            // kart arka plan — koyu
const CBGM    = "rgba(0,0,0,0.68)";            // kart orta ton
const CBD     = "rgba(255,255,255,0.20)";       // kart border
const CORG    = "rgba(224,122,47,0.32)";        // ikon çemberi

const HEADER_H = 108;
const FOOTER_H =  70;
const SEP      =   3;

// ── Supabase ───────────────────────────────────────────────────
const SB_URL = "https://sgisjvvfhwzvhtumrrnk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnaXNqdnZmaHd6dmh0dW1ycm5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzMDcxMSwiZXhwIjoyMDkwODA2NzExfQ.WMnBMmW7uZaxauH2sMaJlyC4ZNMVAaunm664zv53DaU";

// ── Statik varlıklar ────────────────────────────────────────────
const LOGO    = "data:image/png;base64," + readFileSync(path.join(__dirname, "public", "logo.png")).toString("base64");
const fontDir = path.join(__dirname, "public", "fonts");
const FONTS = [
  { name: "Roboto", data: readFileSync(path.join(fontDir, "Roboto-Regular.ttf")), weight: 400, style: "normal" },
  { name: "Roboto", data: readFileSync(path.join(fontDir, "Roboto-Medium.ttf")),  weight: 500, style: "normal" },
  { name: "Roboto", data: readFileSync(path.join(fontDir, "Roboto-Bold.ttf")),    weight: 700, style: "normal" },
];

// ── HTTP helper ─────────────────────────────────────────────────
function nodeGet(url, xh = {}, hops = 6) {
  return new Promise(resolve => {
    if (hops < 0) return resolve(null);
    let done = false;
    const fin = v => { if (!done) { done = true; resolve(v); } };
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { "User-Agent": "menugunlugu/4.0", ...xh } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        res.resume(); nodeGet(res.headers.location, xh, hops - 1).then(fin); return;
      }
      if (res.statusCode !== 200) { res.resume(); return fin(null); }
      const ch = [];
      res.on("data", d => ch.push(d));
      res.on("end",  () => fin(Buffer.concat(ch)));
      res.on("error", () => fin(null));
    });
    req.on("error", () => fin(null));
    req.setTimeout(18000, () => { req.destroy(); fin(null); });
  });
}

// ── Emoji ───────────────────────────────────────────────────────
const emojiCache = {};
async function fetchEmoji(emoji) {
  const cp = [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4,"0")).join("-").replace(/-fe0f/g,"");
  if (emojiCache[cp]) return emojiCache[cp];
  const buf = await nodeGet(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`);
  if (!buf) return null;
  emojiCache[cp] = "data:image/svg+xml;base64," + Buffer.from(buf.toString("utf8")).toString("base64");
  return emojiCache[cp];
}
async function loadAdditionalAsset(lang, seg) {
  return lang === "emoji" ? (await fetchEmoji(seg)) || seg : seg;
}

// ── Supabase: tarif görselleri ──────────────────────────────────
async function fetchRecipeImages(count = 20) {
  console.log("📸  Tarif görselleri çekiliyor...");
  const url = `${SB_URL}/rest/v1/recipes?select=id,image_url&or=(approval_status.eq.approved,approval_status.is.null)&image_url=not.is.null&limit=${count}&order=created_at.desc`;
  const h   = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const buf = await nodeGet(url, h);
  if (!buf) { console.warn("⚠️  Supabase erişilemedi."); return []; }
  let recipes; try { recipes = JSON.parse(buf.toString("utf8")); } catch { return []; }
  const imgs = [];
  for (const r of recipes) {
    if (!r.image_url) continue;
    const ib = await nodeGet(r.image_url);
    if (!ib || ib.length < 100) continue;
    try {
      const j = await sharp(ib).jpeg({ quality: 70 }).toBuffer();
      imgs.push("data:image/jpeg;base64," + j.toString("base64"));
    } catch {
      imgs.push(`data:${ib[0]===0x89?"image/png":"image/jpeg"};base64,` + ib.toString("base64"));
    }
    process.stdout.write("·");
  }
  console.log(`\n✅  ${imgs.length} görsel hazır.\n`);
  return imgs;
}

// ═══════════════════════════════════════════════════════════════
// ORTAK BİLEŞENLER
// ═══════════════════════════════════════════════════════════════

function dot() { return { type: "div", props: { style: { width: 4, height: 4, borderRadius: 2, backgroundColor: YELLOW, display: "flex" } } }; }
function Sep() { return { type: "div", props: { style: { height: SEP, backgroundColor: AMBER, flexShrink: 0, display: "flex" } } }; }

function Header({ n }) {
  return {
    type: "div", props: {
      style: { height: HEADER_H, backgroundColor: BROWN, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px", flexShrink: 0, position: "relative" },
      children: [
        { type: "div", props: { style: { display: "flex", flexDirection: "row", alignItems: "center", gap: 18 }, children: [
          { type: "div", props: { style: { color: WHITE, fontSize: 34, fontWeight: 700, lineHeight: 1, display: "flex" }, children: "Menü Günlüğü" } },
          { type: "div", props: { style: { width: 2, height: 28, backgroundColor: "rgba(255,255,255,0.28)", display: "flex" } } },
          { type: "div", props: { style: { color: CREAMS, fontSize: 18, display: "flex" }, children: "menugunlugu.com" } },
        ] } },
        n ? { type: "div", props: { style: { position: "absolute", right: 40, display: "flex" }, children: { type: "div", props: { style: { color: "rgba(255,255,255,0.40)", fontSize: 15, display: "flex" }, children: `${n} / ${TOTAL}` } } } } : null,
      ].filter(Boolean),
    },
  };
}

function Footer({ tag } = {}) {
  return {
    type: "div", props: {
      style: { height: FOOTER_H, backgroundColor: BROWN, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0 },
      children: [
        { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          dot(), { type: "div", props: { style: { color: CREAMS, fontSize: 13, fontWeight: 700, letterSpacing: 2.5, display: "flex" }, children: "MENUGUNLUGU.COM" } }, dot(),
        ] } },
        { type: "div", props: { style: { color: YELLOW, fontSize: 10, letterSpacing: 1.5, display: "flex" }, children: tag || "TARİFİNİ YÜKLE · MENÜ OLUŞTUR · PAYLAŞ!" } },
      ],
    },
  };
}

// Slayt wrapper — görsel arka plan + koyu overlay + içerik
function wrap({ content, bg, n, ov }) {
  const overlay = ov || "linear-gradient(160deg, rgba(6,3,1,0.72) 0%, rgba(6,3,1,0.65) 25%, rgba(6,3,1,0.75) 55%, rgba(6,3,1,0.97) 100%)";
  return {
    type: "div", props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0502", position: "relative", overflow: "hidden" },
      children: [
        Header({ n }),
        Sep(),
        { type: "div", props: {
          style: { flex: 1, position: "relative", display: "flex", overflow: "hidden" },
          children: [
            bg ? { type: "img", props: { src: bg, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } } } : null,
            { type: "div", props: { style: { position: "absolute", inset: 0, background: overlay, display: "flex" } } },
            { type: "div", props: { style: { position: "relative", flex: 1, display: "flex", flexDirection: "column", padding: "28px 44px 32px" }, children: [content] } },
          ].filter(Boolean),
        } },
        Sep(),
        Footer(),
      ],
    },
  };
}

// ── Atom bileşenler ─────────────────────────────────────────────

// Badge (küçük etiket)
function bdg(text, solid = true) {
  return { type: "div", props: {
    style: { display: "flex", alignSelf: "flex-start", backgroundColor: solid ? ORANGE : "rgba(224,122,47,0.24)", border: solid ? "none" : `1px solid ${ORANGE}`, color: WHITE, fontSize: 11, fontWeight: 700, letterSpacing: 1.8, padding: "7px 18px", borderRadius: 4 },
    children: text,
  } };
}

// Başlık kutusu — çerçeveli (badge + title + opsiyonel subtitle)
function titleBox(badge, title, subtitle) {
  return { type: "div", props: {
    style: { backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "20px 26px", display: "flex", flexDirection: "column", gap: 10 },
    children: [
      badge ? bdg(badge) : null,
      { type: "div", props: { style: { color: WHITE, fontSize: 40, fontWeight: 700, lineHeight: 1.15, display: "flex" }, children: title } },
      subtitle ? { type: "div", props: { style: { color: ORANGE, fontSize: 16, fontWeight: 500, display: "flex" }, children: subtitle } } : null,
    ].filter(Boolean),
  } };
}

// Başlık (sadece metin, çerçevesiz - kullanılacak yerlerde)
function hl(text, size = 42) {
  return { type: "div", props: { style: { color: WHITE, fontSize: size, fontWeight: 700, lineHeight: 1.12, display: "flex" }, children: text } };
}

// Turuncu ayraç çizgi
function oLine() { return { type: "div", props: { style: { width: 64, height: 3, backgroundColor: ORANGE, borderRadius: 2, display: "flex" } } }; }

// Emoji daire
function iCirc(emoji, sz = 52, bg = CORG) {
  return { type: "div", props: { style: { width: sz, height: sz, borderRadius: sz/2, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz*0.44, flexShrink: 0 }, children: emoji } };
}

// Yatay özellik satırı
function fRow(emoji, title, desc, accent = false) {
  return { type: "div", props: {
    style: { display: "flex", alignItems: "center", gap: 18, backgroundColor: accent ? "rgba(224,122,47,0.22)" : CBG, border: accent ? `1.5px solid rgba(224,122,47,0.55)` : `1px solid ${CBD}`, borderRadius: 14, padding: "16px 20px" },
    children: [
      iCirc(emoji, 52, accent ? "rgba(224,122,47,0.38)" : CORG),
      { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
        { type: "div", props: { style: { color: WHITE, fontSize: 17, fontWeight: 700, display: "flex" }, children: title } },
        desc ? { type: "div", props: { style: { color: MUTED, fontSize: 13, lineHeight: 1.42, display: "flex" }, children: desc } } : null,
      ].filter(Boolean) } },
    ],
  } };
}

// Küçük kart (2x2 grid için)
function card2x2(emoji, title, desc) {
  return { type: "div", props: {
    style: { width: 446, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `4px solid ${ORANGE}`, borderRadius: 16, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 10 },
    children: [
      { type: "div", props: { style: { fontSize: 36, display: "flex" }, children: emoji } },
      { type: "div", props: { style: { color: WHITE, fontSize: 18, fontWeight: 700, display: "flex" }, children: title } },
      { type: "div", props: { style: { color: MUTED, fontSize: 13, lineHeight: 1.45, display: "flex" }, children: desc } },
    ],
  } };
}

// Stat kutu
function stat(num, label) {
  return { type: "div", props: {
    style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
    children: [
      { type: "div", props: { style: { color: ORANGE, fontSize: 36, fontWeight: 700, lineHeight: 1, textAlign: "center", display: "flex" }, children: num } },
      { type: "div", props: { style: { color: CREAM, fontSize: 11, fontWeight: 700, textAlign: "center", letterSpacing: 0.5, display: "flex" }, children: label } },
    ],
  } };
}

// Bullet nokta
function bul(text, size = 14) {
  return { type: "div", props: {
    style: { display: "flex", alignItems: "flex-start", gap: 12 },
    children: [
      { type: "div", props: { style: { color: ORANGE, fontSize: 8, flexShrink: 0, marginTop: 5, display: "flex" }, children: "●" } },
      { type: "div", props: { style: { color: CREAMS, fontSize: size, lineHeight: 1.55, display: "flex" }, children: text } },
    ],
  } };
}

// ═══════════════════════════════════════════════════════════════
// SLAYTLAR — PDF ile birebir eşleşme
// ═══════════════════════════════════════════════════════════════

// ── 01 KAPAK ───────────────────────────────────────────────────
// PDF Slide 1: Büyük başlık + altbaşlık + tagline + url
// Logo arka planı YOK — sadece metin, food bg üzerinde çerçeveli kutular
function s01(bg) {
  const ov = "linear-gradient(to bottom, rgba(6,3,1,0.68) 0%, rgba(6,3,1,0.55) 35%, rgba(6,3,1,0.80) 65%, rgba(6,3,1,0.97) 100%)";
  return {
    type: "div", props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0502", overflow: "hidden" },
      children: [
        Header({ n: null }),
        Sep(),
        { type: "div", props: { style: { flex: 1, position: "relative", display: "flex", overflow: "hidden" }, children: [
          bg ? { type: "img", props: { src: bg, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } } } : null,
          { type: "div", props: { style: { position: "absolute", inset: 0, background: ov, display: "flex" } } },
          { type: "div", props: {
            style: { position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 52px", gap: 20 },
            children: [
              // Platform badge
              bdg("PLATFORM TANITIMI"),
              // Ana başlık kutusu — çerçeveli
              { type: "div", props: {
                style: { backgroundColor: "rgba(0,0,0,0.80)", border: `2px solid rgba(224,122,47,0.60)`, borderRadius: 20, padding: "32px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" },
                children: [
                  { type: "div", props: { style: { color: WHITE, fontSize: 90, fontWeight: 700, lineHeight: 1.0, textAlign: "center", display: "flex" }, children: "Menü" } },
                  { type: "div", props: { style: { color: ORANGE, fontSize: 90, fontWeight: 700, lineHeight: 1.0, textAlign: "center", display: "flex" }, children: "Günlüğü" } },
                  { type: "div", props: { style: { width: 80, height: 3, backgroundColor: ORANGE, borderRadius: 2, margin: "6px 0", display: "flex" } } },
                  { type: "div", props: { style: { color: CREAM, fontSize: 20, fontWeight: 400, textAlign: "center", display: "flex" }, children: "Günlük Menü Platformu & Dijital Yemek Topluluğu" } },
                ],
              } },
              // Tagline kutusu
              { type: "div", props: {
                style: { backgroundColor: "rgba(0,0,0,0.72)", border: `1px solid rgba(224,122,47,0.35)`, borderRadius: 14, padding: "18px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" },
                children: [
                  { type: "div", props: { style: { color: ORANGE, fontSize: 19, lineHeight: 1.5, textAlign: "center", display: "flex" }, children: "Her gün yeni bir menü. Her sofraya yeni bir fikir." } },
                  { type: "div", props: { style: { color: CREAMS, fontSize: 16, display: "flex" }, children: "menugunlugu.com" } },
                ],
              } },
              // Alt swipe
              { type: "div", props: { style: { position: "absolute", bottom: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
                { type: "div", props: { style: { color: ORANGE, fontSize: 28, display: "flex" }, children: "›" } },
                { type: "div", props: { style: { color: MUTED, fontSize: 10, letterSpacing: 2, display: "flex" }, children: "KAYDIRMAYA DEVAM ET" } },
              ] } },
            ],
          } },
        ].filter(Boolean) } },
        Sep(),
        Footer({ tag: "TARİFİNİ PAYLAŞ · MENÜ OLUŞTUR · KEŞFEDİN" }),
      ],
    },
  };
}

// ── 02 MENÜ GÜNLÜĞÜ NEDİR? ────────────────────────────────────
// PDF Slide 2: Açıklama metni (sol) + 4 özellik listesi (sağ)
function s02(bg) {
  const items = [
    { e: "🍽️", t: "Günün Menüsü" },
    { e: "📅", t: "Dünün Menüsü" },
    { e: "✨", t: "Menü Oluştur" },
    { e: "👥", t: "Topluluk" },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 16, flex: 1 }, children: [
    // Başlık — çerçeveli
    { type: "div", props: {
      style: { backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 8 },
      children: [
        bdg("01 · PLATFORM"),
        { type: "div", props: { style: { color: WHITE, fontSize: 42, fontWeight: 700, lineHeight: 1.1, display: "flex" }, children: "Menü Günlüğü Nedir?" } },
      ],
    } },
    // İki kolon
    { type: "div", props: { style: { display: "flex", gap: 16, flex: 1 }, children: [
      // Sol — açıklama
      { type: "div", props: { style: { flex: 6, display: "flex", flexDirection: "column", gap: 14 }, children: [
        { type: "div", props: {
          style: { backgroundColor: CBG, border: `1px solid ${CBD}`, borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 },
          children: [
            { type: "div", props: { style: { color: CREAMS, fontSize: 14, lineHeight: 1.65, display: "flex" }, children: "Menü Günlüğü, kullanıcıların günlük yemek planı oluşturabildiği, tarif paylaşabildiği ve kendi menülerini sosyal medyada paylaşabildiği topluluk odaklı dijital bir yemek platformudur." } },
            { type: "div", props: { style: { height: 1, backgroundColor: "rgba(255,255,255,0.10)", display: "flex" } } },
            { type: "div", props: { style: { color: CREAMS, fontSize: 14, lineHeight: 1.65, display: "flex" }, children: "Platform; günlük yemek planlamasını sosyal medya içerik üretimiyle bir araya getiriyor ve her yaştan kullanıcıya ilham veren, aktif bir dijital yemek topluluğu oluşturmayı hedefliyor." } },
          ],
        } },
        // Temel amaç kutusu
        { type: "div", props: {
          style: { backgroundColor: "rgba(224,122,47,0.16)", border: `1px solid rgba(224,122,47,0.42)`, borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 },
          children: [
            { type: "div", props: { style: { color: ORANGE, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, display: "flex" }, children: "Temel amaç:" } },
            { type: "div", props: { style: { color: WHITE, fontSize: 15, lineHeight: 1.6, display: "flex" }, children: '"Bugün ne pişirsem?" sorusuna her gün pratik ve ilham veren bir cevap sunmak.' } },
          ],
        } },
      ] } } ,
      // Sağ — 4 özellik
      { type: "div", props: { style: { flex: 4, backgroundColor: CBG, border: `1px solid ${CBD}`, borderRadius: 14, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }, children: items.map(it => ({
        type: "div", props: {
          style: { display: "flex", alignItems: "center", gap: 14, backgroundColor: CBGM, border: `1px solid rgba(255,255,255,0.12)`, borderLeft: `3px solid ${ORANGE}`, borderRadius: 10, padding: "14px 16px" },
          children: [
            { type: "div", props: { style: { fontSize: 26, display: "flex" }, children: it.e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: it.t } },
          ],
        },
      })) } },
    ] } },
  ] } };
  return wrap({ content, bg, n: "02" });
}

// ── 03 HEDEFİMİZ ───────────────────────────────────────────────
// PDF Slide 3: 4 amaç kartı 2x2
function s03(bg) {
  const goals = [
    { e: "📋", t: "Günlük Menü Platformu",  d: "Türkiye'nin en aktif günlük menü ve yemek planlama kaynağı olmak." },
    { e: "👥", t: "Yemek Topluluğu",          d: "Kullanıcı odaklı tarif ve içerik ekosistemi oluşturmak." },
    { e: "📚", t: "Dijital Tarif Arşivi",     d: "Kapsamlı, kategorize edilmiş, sürekli büyüyen içerik kütüphanesi." },
    { e: "📱", t: "Sosyal Medya Ağı",         d: "Her kullanıcının kendi menüsünü paylaşabildiği aktif bir platform." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 16, flex: 1 }, children: [
    // Başlık — çerçeveli
    titleBox("02 · HEDEFLERİMİZ", "Hedefimiz"),
    // 2x2 grid
    { type: "div", props: { style: { display: "flex", flexWrap: "wrap", gap: 14, flex: 1 }, children: goals.map(g => ({
      type: "div", props: {
        style: { width: 452, background: g.t.includes("Tarif") || g.t.includes("Sosyal") ? "rgba(224,122,47,0.20)" : "rgba(0,0,0,0.78)", border: `1px solid rgba(224,122,47,0.38)`, borderTop: `4px solid ${ORANGE}`, borderRadius: 16, padding: "24px 22px", display: "flex", flexDirection: "column", gap: 12 },
        children: [
          { type: "div", props: { style: { fontSize: 40, display: "flex" }, children: g.e } },
          { type: "div", props: { style: { color: WHITE, fontSize: 18, fontWeight: 700, lineHeight: 1.2, display: "flex" }, children: g.t } },
          { type: "div", props: { style: { color: MUTED, fontSize: 14, lineHeight: 1.5, display: "flex" }, children: g.d } },
        ],
      },
    })) } },
  ] } };
  return wrap({ content, bg, n: "03" });
}

// ── 04 PLATFORM BÖLÜMLERİ ─────────────────────────────────────
// PDF Slide 4: 6 bölüm (Defterim dahil)
function s04(bg) {
  const sections = [
    { e: "🍽️", t: "Günün Menüsü",  d: "Her gün özel hazırlanmış 4 bölümlü günlük menüler." },
    { e: "📅",  t: "Dünün Menüsü", d: "Geçmiş menü arşivi — fikir bankası ve tarih kaydı." },
    { e: "📖",  t: "Tarifler",      d: "4 kategoride organize edilmiş kapsamlı tarif sistemi." },
    { e: "✍️",  t: "Blog",         d: "Mutfak rehberleri, yemek kültürü ve püf noktaları." },
    { e: "✨",  t: "Menü Oluştur",  d: "Kişisel menü oluştur, sosyal medyada direkt paylaş.", a: true },
    { e: "📚",  t: "Defterim",      d: "Beğendiğin tarif ve içerikleri kaydet, kişisel koleksiyonunu oluştur." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    titleBox("03 · PLATFORM BÖLÜMLERİ", "Platform Bölümleri"),
    { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 10, flex: 1 }, children: sections.map(s => fRow(s.e, s.t, s.d, s.a)) } },
  ] } };
  return wrap({ content, bg, n: "04" });
}

// ── 05 GÜNÜN MENÜSÜ ────────────────────────────────────────────
// PDF Slide 5: 2x2 grid sol + sağda akış (Günlük Menü → SM → Görünürlük) + alt not
function s05(bg) {
  const cats = [
    { e: "🍲", t: "Çorba",          d: "Her güne sıcak ve doyurucu bir başlangıç yapılır." },
    { e: "🥘", t: "Ana Yemek",       d: "Günün özenle seçilmiş, en doyurucu lezzeti sofrada yerini alır." },
    { e: "🥗", t: "Yardımcı Lezzet", d: "Ana yemeğe eşlik eden, sofrayı dengeleyen özel bir seçim." },
    { e: "🍮", t: "Tatlı",           d: "Güzel bir sofranın en tatlı kapanışı, günün son lezzeti." },
  ];
  const flow = [
    { e: "📋", t: "Günlük Menü",    d: "Her gün dört kategoriden oluşan, özenle hazırlanmış bir menü yayınlanır." },
    { e: "📱", t: "Sosyal Medya",   d: "Menü, yazar adını içeren özel şablonla sosyal medyada paylaşılır." },
    { e: "👁️", t: "Görünürlük",    d: "Hem yazarlar hem de kullanıcılar geniş bir kitleye ulaşır." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    titleBox("04 · GÜNÜN MENÜSÜ", "Günün Menüsü", "Platformun kalbi."),
    // Ana içerik: sol 2x2 + sağ akış
    { type: "div", props: { style: { display: "flex", gap: 14, flex: 1 }, children: [
      // Sol — 2x2 grid
      { type: "div", props: { style: { flex: 5, display: "flex", flexDirection: "column", gap: 10 }, children: [
        { type: "div", props: { style: { display: "flex", gap: 10, flex: 1 }, children: [
          { type: "div", props: { style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
            { type: "div", props: { style: { fontSize: 28, display: "flex" }, children: cats[0].e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: cats[0].t } },
            { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.4, display: "flex" }, children: cats[0].d } },
          ] } },
          { type: "div", props: { style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
            { type: "div", props: { style: { fontSize: 28, display: "flex" }, children: cats[1].e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: cats[1].t } },
            { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.4, display: "flex" }, children: cats[1].d } },
          ] } },
        ] } },
        { type: "div", props: { style: { display: "flex", gap: 10, flex: 1 }, children: [
          { type: "div", props: { style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
            { type: "div", props: { style: { fontSize: 28, display: "flex" }, children: cats[2].e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: cats[2].t } },
            { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.4, display: "flex" }, children: cats[2].d } },
          ] } },
          { type: "div", props: { style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "16px 16px", display: "flex", flexDirection: "column", gap: 8 }, children: [
            { type: "div", props: { style: { fontSize: 28, display: "flex" }, children: cats[3].e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: cats[3].t } },
            { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.4, display: "flex" }, children: cats[3].d } },
          ] } },
        ] } },
      ] } },
      // Sağ — akış
      { type: "div", props: { style: { flex: 4, backgroundColor: CBG, border: `1px solid ${CBD}`, borderRadius: 14, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 0 }, children: flow.flatMap((f, i) => {
        const item = { type: "div", props: {
          style: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 10px" },
          children: [
            { type: "div", props: { style: { width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }, children: f.e } },
            { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 3 }, children: [
              { type: "div", props: { style: { color: WHITE, fontSize: 14, fontWeight: 700, display: "flex" }, children: f.t } },
              { type: "div", props: { style: { color: MUTED, fontSize: 11, lineHeight: 1.4, display: "flex" }, children: f.d } },
            ] } },
          ],
        } };
        if (i < flow.length - 1) return [item, { type: "div", props: { style: { width: 2, height: 16, backgroundColor: ORANGE, alignSelf: "flex-start", marginLeft: 28, display: "flex" } } }];
        return [item];
      }) } },
    ] } },
    // Alt not
    { type: "div", props: {
      style: { backgroundColor: "rgba(224,122,47,0.14)", border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 12, padding: "14px 18px" },
      children: [{ type: "div", props: { style: { color: CREAM, fontSize: 13, lineHeight: 1.55, display: "flex" }, children: "Günün Menüsü, yazar adı içeren özel şablonlarla birlikte Menü Günlüğü ve Hikayeli Yemekler sosyal medya hesaplarında düzenli olarak paylaşılır." } }],
    } },
  ] } };
  return wrap({ content, bg, n: "05" });
}

// ── 06 MENÜ OLUŞTUR ────────────────────────────────────────────
// PDF Slide 6: 4 adım (sol) + menü kartı mockup (sağ)
function s06(bg) {
  const steps = [
    { n: "1", t: "Sistemdeki tariflerden seçim yap." },
    { n: "2", t: "Günlük menünü oluştur." },
    { n: "3", t: "Sosyal medyada direkt paylaş (Post / Story).", h: true },
    { n: "4", t: "PDF tarif kataloğu oluştur." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    { type: "div", props: { style: { display: "flex", gap: 12, alignItems: "center" }, children: [
      titleBox(null, "Menü Oluştur"),
      bdg("✨ EN ÖZEL ÖZELLİK"),
    ] } },
    // Sol adımlar + sağ mockup
    { type: "div", props: { style: { display: "flex", gap: 16, flex: 1 }, children: [
      // Sol — adımlar
      { type: "div", props: { style: { flex: 5, display: "flex", flexDirection: "column", gap: 11 }, children: steps.map(s => ({
        type: "div", props: {
          style: { display: "flex", alignItems: "center", gap: 16, backgroundColor: s.h ? "rgba(224,122,47,0.22)" : CBG, border: s.h ? `1.5px solid ${ORANGE}` : `1px solid ${CBD}`, borderRadius: 14, padding: "16px 18px" },
          children: [
            { type: "div", props: { style: { width: 40, height: 40, borderRadius: 20, backgroundColor: s.h ? ORANGE : "rgba(224,122,47,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: WHITE, flexShrink: 0 }, children: s.n } },
            { type: "div", props: { style: { color: s.h ? WHITE : CREAMS, fontSize: 15, fontWeight: s.h ? 700 : 400, lineHeight: 1.4, display: "flex" }, children: s.t } },
          ],
        },
      })) } },
      // Sağ — menü kartı mockup
      { type: "div", props: {
        style: { flex: 4, backgroundColor: "#2C1A0E", border: `2px solid ${ORANGE}`, borderRadius: 16, padding: "0", display: "flex", flexDirection: "column", overflow: "hidden" },
        children: [
          // Kart başlığı
          { type: "div", props: { style: { backgroundColor: ORANGE, padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }, children: [
            { type: "div", props: { style: { color: WHITE, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: "flex" }, children: "GÜNÜN MENÜSÜ" } },
            { type: "div", props: { style: { color: "rgba(255,255,255,0.85)", fontSize: 10, display: "flex" }, children: "Pazartesi, 28 Nisan • menugunlugu.com" } },
          ] } },
          // Menü öğeleri
          ...[
            { cat: "ÇORBA", name: "Mercimek Çorbası", e: "🍲" },
            { cat: "ANA YEMEK", name: "Kuru Fasulye", e: "🥘" },
            { cat: "YARDIMCI", name: "Cacık", e: "🥗" },
            { cat: "TATLI", name: "Sütlaç", e: "🍮" },
          ].map(item => ({
            type: "div", props: {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.10)" },
              children: [
                { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 2 }, children: [
                  { type: "div", props: { style: { color: ORANGE, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, display: "flex" }, children: item.cat } },
                  { type: "div", props: { style: { color: WHITE, fontSize: 14, fontWeight: 700, display: "flex" }, children: item.name } },
                ] } },
                { type: "div", props: { style: { fontSize: 24, display: "flex" }, children: item.e } },
              ],
            },
          })),
          // Kart alt
          { type: "div", props: { style: { backgroundColor: "#1A0F07", padding: "8px 14px", display: "flex", justifyContent: "space-between" }, children: [
            { type: "div", props: { style: { color: ORANGE, fontSize: 10, fontWeight: 700, display: "flex" }, children: "@yazar_adi" } },
            { type: "div", props: { style: { color: MUTED, fontSize: 10, display: "flex" }, children: "menugunlugu.com" } },
          ] } },
          // Format
          { type: "div", props: { style: { backgroundColor: CBGM, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
            { type: "div", props: { style: { color: MUTED, fontSize: 10, textAlign: "center", display: "flex" }, children: "Post 1080×1350 · Story 1080×1920" } },
          ] } },
        ],
      } },
    ] } },
  ] } };
  return wrap({ content, bg, n: "06" });
}

// ── 07 YAPAY ZEKÂ ─────────────────────────────────────────────
// PDF Slide 7: Çok Yakında badge + robot + quote + 3 adım akışı
function s07(bg) {
  const steps = [
    { e: "🛒", l: "Malzeme Seç",    a: false },
    { e: "🤖", l: "Yapay Zekâ",     a: true  },
    { e: "🍳", l: "Tarif Önerisi",  a: false },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 18, flex: 1 }, children: [
    // Başlık + badge
    { type: "div", props: { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [
      { type: "div", props: { style: { backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8, flex: 1, marginRight: 16 }, children: [
        bdg("06 · YAPAY ZEKÂ"),
        { type: "div", props: { style: { color: WHITE, fontSize: 34, fontWeight: 700, lineHeight: 1.2, display: "flex" }, children: "Yapay Zekâ Destekli\nYemek Öneri Sistemi" } },
      ] } },
      { type: "div", props: { style: { backgroundColor: ORANGE, borderRadius: 10, padding: "10px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }, children: [
        { type: "div", props: { style: { fontSize: 20, display: "flex" }, children: "🚀" } },
        { type: "div", props: { style: { color: WHITE, fontSize: 12, fontWeight: 700, textAlign: "center", display: "flex" }, children: "Çok\nYakında" } },
      ] } },
    ] } },
    // Robot büyük — çerçeveli
    { type: "div", props: {
      style: { backgroundColor: "rgba(224,122,47,0.14)", border: `1px solid rgba(224,122,47,0.42)`, borderRadius: 20, padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, flex: 1 },
      children: [
        { type: "div", props: { style: { width: 100, height: 100, borderRadius: 50, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, display: "flex" }, children: "🤖" } },
        { type: "div", props: { style: { color: WHITE, fontSize: 20, fontWeight: 700, textAlign: "center", lineHeight: 1.5, display: "flex" }, children: '"Evdeki malzemelerini seç, sana özel yemek önerileri al."' } },
      ],
    } },
    // 3 adım akış
    { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: steps.flatMap((s, i) => {
      const c = { type: "div", props: {
        style: { flex: 1, backgroundColor: s.a ? "rgba(224,122,47,0.24)" : CBG, border: s.a ? `2px solid ${ORANGE}` : `1px solid ${CBD}`, borderRadius: 16, padding: "22px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
        children: [
          { type: "div", props: { style: { fontSize: 36, display: "flex" }, children: s.e } },
          { type: "div", props: { style: { color: s.a ? ORANGE : WHITE, fontSize: 15, fontWeight: 700, textAlign: "center", display: "flex" }, children: s.l } },
        ],
      } };
      if (i < steps.length - 1) return [c, { type: "div", props: { style: { color: ORANGE, fontSize: 28, display: "flex" }, children: "→" } }];
      return [c];
    }) } },
  ] } };
  return wrap({ content, bg, n: "07" });
}

// ── 08 GÜNÜN RESTORANI ─────────────────────────────────────────
// PDF Slide 8: Yakında badge + 4 adım 2x2
function s08(bg) {
  const steps = [
    { n: "1", e: "📍", t: "Restoran Öner",        d: "Kullanıcılar sevdikleri restoranları platforma ekle ve toplulukla paylaşır." },
    { n: "2", e: "⭐", t: "En İyi Yemekler",       d: "Restoranın en çok beğenilen yemekleri oylanarak listelenir." },
    { n: "3", e: "📋", t: "Menü Oluşturulur",      d: "Seçilen yemeklerden paylaşılabilir bir restoran menüsü otomatik olarak hazırlanır." },
    { n: "4", e: "📱", t: "Paylaş & Yorum Yap",    d: "Menü sosyal medyada paylaşılır, topluluk yorum yaparak deneyimini aktarır." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    // Başlık + badge
    { type: "div", props: { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }, children: [
      { type: "div", props: {
        style: { flex: 1, backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 8 },
        children: [
          bdg("07 · YENİ ÖZELLİK"),
          { type: "div", props: { style: { color: WHITE, fontSize: 40, fontWeight: 700, lineHeight: 1.1, display: "flex" }, children: "Günün Restoranı" } },
          { type: "div", props: { style: { color: ORANGE, fontSize: 15, display: "flex" }, children: "Restoran öner, en iyi yemeklerden paylaşılabilir restoran menüsü oluştur." } },
        ],
      } },
      { type: "div", props: { style: { backgroundColor: ORANGE, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
        { type: "div", props: { style: { fontSize: 22, display: "flex" }, children: "🍴" } },
        { type: "div", props: { style: { color: WHITE, fontSize: 13, fontWeight: 700, display: "flex" }, children: "Yakında" } },
      ] } },
    ] } },
    // 2x2 adım kartları
    { type: "div", props: { style: { display: "flex", flexWrap: "wrap", gap: 14, flex: 1 }, children: steps.map(s => ({
      type: "div", props: {
        style: { width: 452, backgroundColor: CBG, border: `1px solid ${CBD}`, borderRadius: 16, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12 },
        children: [
          { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
            { type: "div", props: { style: { width: 44, height: 44, borderRadius: 22, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: WHITE, flexShrink: 0 }, children: s.n } },
            { type: "div", props: { style: { fontSize: 28, display: "flex" }, children: s.e } },
            { type: "div", props: { style: { color: WHITE, fontSize: 17, fontWeight: 700, display: "flex" }, children: s.t } },
          ] } },
          { type: "div", props: { style: { color: MUTED, fontSize: 13, lineHeight: 1.5, display: "flex" }, children: s.d } },
        ],
      },
    })) } },
  ] } };
  return wrap({ content, bg, n: "08" });
}

// ── 09 EKOSİSTEM ───────────────────────────────────────────────
// PDF Slide 9: Menü Günlüğü merkez + 4 bağlantı (Tarifler & Menüler, Yazarlar, Kullanıcılar, Sosyal Medya)
// Badge: Mobil Uygulama · Yakında
function s09(bg) {
  const nodes = [
    { e: "📖", t: "Tarifler & Menüler",   pos: "top" },
    { e: "✍️", t: "Yazarlar",             pos: "left" },
    { e: "👥", t: "Kullanıcılar",         pos: "right" },
    { e: "📱", t: "Sosyal Medya",         pos: "bottom" },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    // Başlık + badge
    { type: "div", props: { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }, children: [
      { type: "div", props: {
        style: { flex: 1, backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "16px 22px", display: "flex", flexDirection: "column", gap: 8 },
        children: [
          bdg("08 · EKOSİSTEM"),
          { type: "div", props: { style: { color: WHITE, fontSize: 38, fontWeight: 700, lineHeight: 1.1, display: "flex" }, children: "Menü Günlüğü\nEkosistemi" } },
        ],
      } },
      { type: "div", props: { style: { backgroundColor: ORANGE, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }, children: [
        { type: "div", props: { style: { fontSize: 18, display: "flex" }, children: "📲" } },
        { type: "div", props: { style: { color: WHITE, fontSize: 10, fontWeight: 700, textAlign: "center", display: "flex" }, children: "Mobil Uygulama" } },
        { type: "div", props: { style: { color: "rgba(255,255,255,0.85)", fontSize: 10, display: "flex" }, children: "Yakında" } },
      ] } },
    ] } },
    // Diyagram: üst + orta + alt
    { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 12, flex: 1 }, children: [
      // Üst — Tarifler & Menüler
      { type: "div", props: { style: { display: "flex", justifyContent: "center" }, children: [
        { type: "div", props: {
          style: { backgroundColor: CBG, border: `2px solid rgba(224,122,47,0.55)`, borderRadius: 14, padding: "14px 32px", display: "flex", alignItems: "center", gap: 12 },
          children: [
            { type: "div", props: { style: { fontSize: 26, display: "flex" }, children: "📖" } },
            { type: "div", props: { style: { color: WHITE, fontSize: 17, fontWeight: 700, display: "flex" }, children: "Tarifler & Menüler" } },
          ],
        } },
      ] } },
      // Orta satır — Yazarlar + Merkez + Kullanıcılar
      { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
        // Yazarlar
        { type: "div", props: {
          style: { flex: 1, backgroundColor: CBG, border: `2px solid rgba(224,122,47,0.55)`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 },
          children: [
            { type: "div", props: { style: { fontSize: 24, display: "flex" }, children: "✍️" } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: "Yazarlar" } },
          ],
        } },
        // Bağlantı çizgisi
        { type: "div", props: { style: { width: 20, height: 2, backgroundColor: ORANGE, display: "flex" } } },
        // Merkez
        { type: "div", props: {
          style: { backgroundColor: ORANGE, borderRadius: 16, padding: "20px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
          children: [
            { type: "div", props: { style: { color: WHITE, fontSize: 22, fontWeight: 700, textAlign: "center", display: "flex" }, children: "Menü\nGünlüğü" } },
          ],
        } },
        // Bağlantı çizgisi
        { type: "div", props: { style: { width: 20, height: 2, backgroundColor: ORANGE, display: "flex" } } },
        // Kullanıcılar
        { type: "div", props: {
          style: { flex: 1, backgroundColor: CBG, border: `2px solid rgba(224,122,47,0.55)`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 },
          children: [
            { type: "div", props: { style: { fontSize: 24, display: "flex" }, children: "👥" } },
            { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: "Kullanıcılar" } },
          ],
        } },
      ] } },
      // Alt — Sosyal Medya
      { type: "div", props: { style: { display: "flex", justifyContent: "center" }, children: [
        { type: "div", props: {
          style: { backgroundColor: CBG, border: `2px solid rgba(224,122,47,0.55)`, borderRadius: 14, padding: "14px 32px", display: "flex", alignItems: "center", gap: 12 },
          children: [
            { type: "div", props: { style: { fontSize: 26, display: "flex" }, children: "📱" } },
            { type: "div", props: { style: { color: WHITE, fontSize: 17, fontWeight: 700, display: "flex" }, children: "Sosyal Medya" } },
          ],
        } },
      ] } },
    ] } },
    // Alt açıklama
    { type: "div", props: {
      style: { backgroundColor: "rgba(224,122,47,0.14)", border: `1px solid rgba(224,122,47,0.35)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 12, padding: "14px 18px" },
      children: [{ type: "div", props: { style: { color: CREAM, fontSize: 13, lineHeight: 1.6, display: "flex" }, children: "Hikayeli Yemekler çatısı altında hayata geçen Menü Günlüğü; içerik üreticilerini, kullanıcıları ve markaları tek bir gastronomi platformunda bir araya getirmeyi hedefleyen yeni nesil bir gastronomi platformudur." } }],
    } },
  ] } };
  return wrap({ content, bg, n: "09" });
}

// ── 10 KULLANICI DENEYİMİ ─────────────────────────────────────
// PDF Slide 10: 6 özellik 2x3 (Defterim, Yorum&Değerlendirme, Takip, Porsiyon, Menü Oluştur, Günlük Menü Takibi)
function s10(bg) {
  const feats = [
    { e: "📚", t: "Defterim",                   d: "Beğendiğin tarif ve yazıları kaydet, kendi koleksiyonunu oluştur." },
    { e: "💬", t: "Yorum & Değerlendirme",       d: "Tarif ve yazılara yorum ekle, tarifleri puanla." },
    { e: "👥", t: "Takip Sistemi",               d: "Yazarları takip et, yeni içeriklerini kaçırma." },
    { e: "⚖️", t: "Porsiyon Ölçeklendirme",     d: "2, 4 veya 8 kişilik otomatik malzeme hesaplama." },
    { e: "✨", t: "Menü Oluştur",                d: "Kişisel günlük menünü oluştur, sosyal medyada direkt paylaş." },
    { e: "📅", t: "Günlük Menü Takibi",          d: "Her gün yeni menüyü keşfet, tarif detaylarına bak, sofranı planla." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    titleBox("09 · KULLANICI DENEYİMİ", "Kullanıcı Deneyimi"),
    { type: "div", props: { style: { display: "flex", flexWrap: "wrap", gap: 12, flex: 1 }, children: feats.map(f => ({
      type: "div", props: {
        style: { width: 452, backgroundColor: CBG, border: `1px solid ${CBD}`, borderLeft: `3px solid ${ORANGE}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 14 },
        children: [
          iCirc(f.e, 50),
          { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
            { type: "div", props: { style: { color: WHITE, fontSize: 15, fontWeight: 700, display: "flex" }, children: f.t } },
            { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.45, display: "flex" }, children: f.d } },
          ] } },
        ],
      },
    })) } },
  ] } };
  return wrap({ content, bg, n: "10" });
}

// ── 11 YAZARLAR ────────────────────────────────────────────────
// PDF Slide 11: 3 kart (Yazar Kartı, Günün Menüsü'nde, Sosyal Medya) + Yazar Analitiği callout
function s11(bg) {
  const cards = [
    { e: "👤", t: "Yazar Kartı",           d: "Profil sayfanız, sosyal medya hesaplarınız ve takipçi sisteminiz tek bir yerden." },
    { e: "⭐", t: "Günün Menüsü'nde",      d: "Tarifleriniz platformun ana akışında görünsün." },
    { e: "📱", t: "Sosyal Medya",           d: "Seçilen tarifler yazar adınızla sosyal medya paylaşımlarında yer alır." },
  ];
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    // Başlık kutusu
    { type: "div", props: {
      style: { backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 8 },
      children: [
        bdg("10 · YAZARLAR İÇİN"),
        { type: "div", props: { style: { color: WHITE, fontSize: 36, fontWeight: 700, lineHeight: 1.1, display: "flex" }, children: "Menü Günlüğünde\nYazar Olmak" } },
        { type: "div", props: { style: { color: ORANGE, fontSize: 16, display: "flex" }, children: "Yalnızca paylaşmak değil — görünür olmak." } },
      ],
    } },
    // 3 kart yan yana
    { type: "div", props: { style: { display: "flex", gap: 12, flex: 1 }, children: cards.map(c => ({
      type: "div", props: {
        style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `4px solid ${ORANGE}`, borderRadius: 16, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" },
        children: [
          { type: "div", props: { style: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(224,122,47,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }, children: c.e } },
          { type: "div", props: { style: { color: WHITE, fontSize: 15, fontWeight: 700, textAlign: "center", display: "flex" }, children: c.t } },
          { type: "div", props: { style: { color: MUTED, fontSize: 12, lineHeight: 1.5, textAlign: "center", display: "flex" }, children: c.d } },
        ],
      },
    })) } },
    // Yazar Analitiği callout
    { type: "div", props: {
      style: { backgroundColor: "rgba(0,0,0,0.80)", border: `1px solid rgba(224,122,47,0.42)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 },
      children: [
        { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
          { type: "div", props: { style: { fontSize: 22, display: "flex" }, children: "📊" } },
          { type: "div", props: { style: { color: ORANGE, fontSize: 15, fontWeight: 700, letterSpacing: 0.5, display: "flex" }, children: "Yazar Analitiği" } },
        ] } },
        { type: "div", props: { style: { color: CREAM, fontSize: 13, lineHeight: 1.5, display: "flex" }, children: "Tarif görüntüleme  •  Beğeni sayısı  •  Takipçi istatistikleri  •  Menü paylaşım performansı." } },
        { type: "div", props: { style: { color: MUTED, fontSize: 13, display: "flex" }, children: "Menü Günlüğü; mutfak odaklı içerik üreticileri için aktif bir paylaşım ve büyüme platformudur." } },
      ],
    } },
  ] } };
  return wrap({ content, bg, n: "11" });
}

// ── 12 İŞ BİRLİKLERİ ──────────────────────────────────────────
// PDF Slide 12: 2 kolon (Markalar İçin, İçerik Üreticileri İçin)
function s12(bg) {
  const marka = [
    "Sponsorlu menü içerikleri.",
    "Tarif entegrasyonları.",
    "Hedef kitleye doğrudan ulaşım.",
    "Sosyal medya kampanyaları.",
    "Ürün deneyim çalışmaları.",
  ];
  const icure = [
    "Workshop etkinlikleri.",
    "Görünürlük ve takipçi büyümesi.",
    "Özel davet ve etkinlikler.",
    "İçerik ortaklıkları.",
    "Platform içi öne çıkma.",
  ];
  function listBox(title, emoji, items) {
    return { type: "div", props: {
      style: { flex: 1, backgroundColor: CBG, border: `1px solid ${CBD}`, borderTop: `3px solid ${ORANGE}`, borderRadius: 14, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 },
      children: [
        { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 12, backgroundColor: "rgba(224,122,47,0.18)", borderRadius: 10, padding: "10px 14px" }, children: [
          { type: "div", props: { style: { fontSize: 24, display: "flex" }, children: emoji } },
          { type: "div", props: { style: { color: WHITE, fontSize: 16, fontWeight: 700, display: "flex" }, children: title } },
        ] } },
        { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 11 }, children: items.map(item => bul(item)) } },
      ],
    } };
  }
  const content = { type: "div", props: { style: { display: "flex", flexDirection: "column", gap: 14, flex: 1 }, children: [
    { type: "div", props: {
      style: { backgroundColor: CBG, border: `1px solid rgba(224,122,47,0.38)`, borderLeft: `4px solid ${ORANGE}`, borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 8 },
      children: [
        bdg("11 · İŞ BİRLİKLERİ"),
        { type: "div", props: { style: { color: WHITE, fontSize: 38, fontWeight: 700, lineHeight: 1.1, display: "flex" }, children: "İş Birlikleri &\nMarka Fırsatları" } },
        { type: "div", props: { style: { color: ORANGE, fontSize: 15, display: "flex" }, children: "İçerik üreticileri, markalar ve yemek toplulukları için." } },
      ],
    } },
    { type: "div", props: { style: { display: "flex", gap: 14, flex: 1 }, children: [ listBox("Markalar İçin", "🏢", marka), listBox("İçerik Üreticileri İçin", "✍️", icure) ] } },
  ] } };
  return wrap({ content, bg, n: "12" });
}

// ── 13 KAPANIŞ ─────────────────────────────────────────────────
// PDF Slide 13: Büyük başlık + tagline + logo + iletişim bilgileri
// Logo arka planı var (PDF'de de var) — Kapak dışında logo görünür
function s13(bg) {
  const ov = "linear-gradient(to bottom, rgba(6,3,1,0.68) 0%, rgba(6,3,1,0.55) 35%, rgba(6,3,1,0.80) 65%, rgba(6,3,1,0.97) 100%)";
  return {
    type: "div", props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column", fontFamily: "Roboto", backgroundColor: "#0A0502", overflow: "hidden" },
      children: [
        Header({ n: null }),
        Sep(),
        { type: "div", props: { style: { flex: 1, position: "relative", display: "flex", overflow: "hidden" }, children: [
          bg ? { type: "img", props: { src: bg, style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } } } : null,
          { type: "div", props: { style: { position: "absolute", inset: 0, background: ov, display: "flex" } } },
          { type: "div", props: {
            style: { position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 52px", gap: 18 },
            children: [
              // Ana başlık kutusu — çerçeveli
              { type: "div", props: {
                style: { backgroundColor: "rgba(0,0,0,0.82)", border: `2px solid rgba(224,122,47,0.60)`, borderRadius: 20, padding: "30px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" },
                children: [
                  { type: "div", props: { style: { color: WHITE, fontSize: 72, fontWeight: 700, lineHeight: 1.0, textAlign: "center", display: "flex" }, children: "Menü Günlüğü" } },
                  { type: "div", props: { style: { width: 80, height: 3, backgroundColor: ORANGE, borderRadius: 2, margin: "8px 0 4px", display: "flex" } } },
                  { type: "div", props: { style: { color: WHITE, fontSize: 22, textAlign: "center", display: "flex" }, children: "Her gün yeni bir menü." } },
                  { type: "div", props: { style: { color: ORANGE, fontSize: 22, textAlign: "center", display: "flex" }, children: "Her sofraya yeni bir fikir." } },
                  { type: "div", props: { style: { color: CREAMS, fontSize: 18, marginTop: 6, display: "flex" }, children: "menugunlugu.com" } },
                ],
              } },
              // İletişim bilgileri kutusu
              { type: "div", props: {
                style: { backgroundColor: "rgba(0,0,0,0.78)", border: `1px solid rgba(224,122,47,0.42)`, borderRadius: 16, padding: "20px 32px", display: "flex", flexDirection: "column", gap: 12, width: "100%", alignItems: "center" },
                children: [
                  { type: "div", props: { style: { color: ORANGE, fontSize: 13, fontWeight: 700, letterSpacing: 2, display: "flex" }, children: "İLETİŞİM" } },
                  { type: "div", props: { style: { display: "flex", gap: 32 }, children: [
                    { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                      { type: "div", props: { style: { fontSize: 20, display: "flex" }, children: "🌐" } },
                      { type: "div", props: { style: { color: CREAMS, fontSize: 15, display: "flex" }, children: "menugunlugu.com" } },
                    ] } },
                    { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                      { type: "div", props: { style: { fontSize: 20, display: "flex" }, children: "📷" } },
                      { type: "div", props: { style: { color: CREAMS, fontSize: 15, display: "flex" }, children: "@menugunlugu" } },
                    ] } },
                    { type: "div", props: { style: { display: "flex", alignItems: "center", gap: 10 }, children: [
                      { type: "div", props: { style: { fontSize: 20, display: "flex" }, children: "✉️" } },
                      { type: "div", props: { style: { color: CREAMS, fontSize: 15, display: "flex" }, children: "info@menugunlugu.com" } },
                    ] } },
                  ] } },
                ],
              } },
              // Logo (arka plan var — PDF'deki gibi)
              { type: "img", props: { src: LOGO, width: 100, height: 100, style: { objectFit: "contain", opacity: 0.85 } } },
              // Alt Hikayeli Yemekler
              { type: "div", props: { style: { color: MUTED, fontSize: 13, letterSpacing: 1, display: "flex" }, children: "Hikayeli Yemekler Ekosistemi" } },
            ],
          } },
        ].filter(Boolean) } },
        Sep(),
        Footer({ tag: "TARİFİNİ YÜKLE · MENÜ OLUŞTUR · TOPLULUĞA KATIL" }),
      ],
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
const OUT = path.join(__dirname, "carousel-nedir");
mkdirSync(OUT, { recursive: true });

async function render(jsx, file) {
  const svg = await satori(jsx, { width: W, height: H, fonts: FONTS, embedFont: true, loadAdditionalAsset });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
  writeFileSync(path.join(OUT, file), png);
  console.log(`✅  ${file}`);
}

async function main() {
  console.log("🍽️  Menü Günlüğü — Carousel v4 (PDF eşleşmeli) üretiliyor...\n");
  const imgs = await fetchRecipeImages(20);
  const bg   = i => imgs.length > 0 ? imgs[i % imgs.length] : null;

  const slides = [
    { fn: () => s01(bg(0)),  f: "01-kapak.png" },
    { fn: () => s02(bg(1)),  f: "02-nedir.png" },
    { fn: () => s03(bg(2)),  f: "03-hedefimiz.png" },
    { fn: () => s04(bg(3)),  f: "04-platform-bolumleri.png" },
    { fn: () => s05(bg(4)),  f: "05-gunun-menusu.png" },
    { fn: () => s06(bg(5)),  f: "06-menu-olustur.png" },
    { fn: () => s07(bg(6)),  f: "07-yapay-zeka.png" },
    { fn: () => s08(bg(7)),  f: "08-gunun-restorani.png" },
    { fn: () => s09(bg(8)),  f: "09-ekosistem.png" },
    { fn: () => s10(bg(9)),  f: "10-kullanici.png" },
    { fn: () => s11(bg(10)), f: "11-yazarlar.png" },
    { fn: () => s12(bg(11)), f: "12-is-birlikleri.png" },
    { fn: () => s13(bg(12)), f: "13-kapanis.png" },
  ];

  for (const s of slides) await render(s.fn(), s.f);

  console.log(`\n📁  ${OUT}`);
  console.log(`🎉  ${slides.length} slayt hazır!`);
}

main().catch(err => { console.error(err); process.exit(1); });
