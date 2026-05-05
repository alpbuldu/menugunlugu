const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Menü Günlüğü — Tanıtım Sunumu";
pres.author = "Menü Günlüğü";

const C = {
  orange:     "E07A2F",
  darkOrange: "B85E1A",
  dark:       "3D2B1F",
  medium:     "7C5C47",
  light:      "FAF7F4",
  accent:     "FDF0E6",
  white:      "FFFFFF",
  logoBg:     "F8EEE4",   // exact cream from logo background
};

const LOGO = "/Users/hikayeliyemekler/menugunlugu/public/logo.png";

const makeShadow = () => ({ type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.10 });

const footer = (s) => {
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.37, w: 10, h: 0.25, fill: { color: C.orange } });
  s.addText("menugunlugu.com", { x: 0.35, y: 5.39, w: 4, h: 0.21, fontSize: 10, color: C.white, fontFace: "Calibri", margin: 0 });
};

// ════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Kapak
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: "3D2B1F" };

  // Right panel — cream (matches logo background)
  s.addShape(pres.shapes.RECTANGLE, { x: 6.5, y: 0, w: 3.5, h: 5.625, fill: { color: C.logoBg } });
  // Orange vertical accent bar
  s.addShape(pres.shapes.RECTANGLE, { x: 6.42, y: 0, w: 0.08, h: 5.625, fill: { color: C.orange } });

  // Subtle top decorative line (left panel)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.65, w: 4.5, h: 0.015, fill: { color: "5C3D2A" } });

  // Main title
  s.addText("Menü Günlüğü", {
    x: 0.5, y: 1.15, w: 5.8, h: 0.95,
    fontSize: 48, bold: true, color: C.white,
    fontFace: "Georgia", align: "left", margin: 0,
  });

  // Orange underline
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.18, w: 2.5, h: 0.07, fill: { color: C.orange } });

  // Subtitle
  s.addText("Günlük Menü Platformu\n& Dijital Yemek Topluluğu", {
    x: 0.5, y: 2.38, w: 5.7, h: 0.95,
    fontSize: 20, color: "FDF0E6", fontFace: "Calibri", align: "left",
    lineSpacingMultiple: 1.35, margin: 0,
  });

  // Tagline
  s.addText("Her gün yeni bir menü. Her sofraya yeni bir fikir.", {
    x: 0.5, y: 3.55, w: 5.7, h: 0.5,
    fontSize: 15, italic: true, color: C.orange, fontFace: "Calibri", align: "left", margin: 0,
  });

  // Divider + website
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.3, w: 3.0, h: 0.015, fill: { color: "5C3D2A" } });
  s.addText("menugunlugu.com", {
    x: 0.5, y: 4.45, w: 3, h: 0.3,
    fontSize: 13, color: "B8906A", fontFace: "Calibri", align: "left", margin: 0,
  });

  // Right panel — logo (seamless on cream bg)
  s.addImage({ path: LOGO, x: 6.62, y: 0.62, w: 3.2, h: 3.2 });

  // 5 decorative dots below logo (cover only)
  for (let i = 0; i < 5; i++) {
    s.addShape(pres.shapes.OVAL, {
      x: 7.53 + i * 0.3, y: 4.18, w: 0.13, h: 0.13,
      fill: { color: i === 2 ? C.orange : "C5A880" },
    });
  }

}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 2 — Menü Günlüğü Nedir?
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Menü Günlüğü Nedir?", {
    x: 0.5, y: 0.25, w: 8, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.15, w: 5.8, h: 3.6, fill: { color: C.white }, shadow: makeShadow() });

  s.addText([
    { text: "Menü Günlüğü", options: { bold: true, color: C.dark } },
    { text: ", kullanıcıların günlük yemek planı oluşturabildiği, tarif paylaşabildiği ve kendi menülerini sosyal medyada paylaşabildiği ", options: { color: C.medium } },
    { text: "topluluk odaklı dijital bir yemek platformudur.", options: { bold: true, color: C.dark } },
  ], { x: 0.7, y: 1.35, w: 5.4, h: 0.9, fontSize: 14, fontFace: "Calibri", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 2.35, w: 5.4, h: 0.04, fill: { color: "EDD5BC" } });

  s.addText("Platform; günlük yemek planlamasını sosyal medya içerik üretimiyle bir araya getiriyor ve her yaştan kullanıcıya ilham veren, aktif bir dijital yemek topluluğu oluşturmayı hedefliyor.", {
    x: 0.7, y: 2.5, w: 5.4, h: 0.8, fontSize: 13, color: C.medium, fontFace: "Calibri", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.4, w: 5.4, h: 0.04, fill: { color: "EDD5BC" } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.55, w: 5.4, h: 0.9, fill: { color: C.accent } });
  s.addText([
    { text: "Temel amaç: ", options: { bold: true, color: C.orange } },
    { text: '"Bugün ne pişirsem?"', options: { bold: true, italic: true, color: C.dark } },
    { text: " sorusuna her gün pratik ve ilham veren bir cevap sunmak.", options: { color: C.medium } },
  ], { x: 0.9, y: 3.6, w: 5.0, h: 0.8, fontSize: 13, fontFace: "Calibri", margin: 0 });

  // Right dark panel
  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 1.15, w: 2.9, h: 3.6, fill: { color: C.dark }, shadow: makeShadow() });
  const pillars = [
    { emoji: "🍽️", label: "Günün Menüsü" },
    { emoji: "📅", label: "Dünün Menüsü" },
    { emoji: "✨", label: "Menü Oluştur" },
    { emoji: "👥", label: "Topluluk" },
  ];
  pillars.forEach((item, i) => {
    const y = 1.35 + i * 0.82;
    s.addText(item.emoji, { x: 6.75, y, w: 0.8, h: 0.6, fontSize: 28, align: "center", margin: 0 });
    s.addText(item.label, { x: 7.6, y: y + 0.1, w: 1.7, h: 0.4, fontSize: 12, color: "FDF0E6", fontFace: "Calibri", margin: 0 });
    if (i < 3) s.addShape(pres.shapes.RECTANGLE, { x: 6.75, y: y + 0.68, w: 2.55, h: 0.02, fill: { color: "5C3D2A" } });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Hedefimiz
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Hedefimiz", {
    x: 0.5, y: 0.2, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  const goals = [
    { emoji: "🗓️", title: "Günlük Menü Platformu",   desc: "Türkiye'nin en aktif günlük menü ve\nyemek planlama kaynağı olmak.",  x: 0.4,  y: 1.1, bg: C.dark },
    { emoji: "👥", title: "Yemek Topluluğu",          desc: "Kullanıcı odaklı tarif ve içerik\nekosistemi oluşturmak.",              x: 5.15, y: 1.1, bg: C.darkOrange },
    { emoji: "📚", title: "Dijital Tarif Arşivi",     desc: "Kapsamlı, kategorize edilmiş,\nsürekli büyüyen içerik kütüphanesi.", x: 0.4,  y: 3.1, bg: C.darkOrange },
    { emoji: "📱", title: "Sosyal Medya Ağı",         desc: "Her kullanıcının kendi menüsünü\npaylaşabildiği aktif bir platform.",   x: 5.15, y: 3.1, bg: C.dark },
  ];

  goals.forEach(g => {
    s.addShape(pres.shapes.RECTANGLE, { x: g.x, y: g.y, w: 4.55, h: 1.8, fill: { color: g.bg }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: g.x, y: g.y, w: 4.55, h: 0.06, fill: { color: C.orange } });
    s.addText(g.emoji, { x: g.x + 0.2, y: g.y + 0.2, w: 0.7, h: 0.7, fontSize: 30, margin: 0 });
    s.addText(g.title, { x: g.x + 1.0, y: g.y + 0.2, w: 3.4, h: 0.42, fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
    s.addText(g.desc,  { x: g.x + 0.2, y: g.y + 1.0, w: 4.2, h: 0.65, fontSize: 11.5, color: "FDF0E6", fontFace: "Calibri", margin: 0 });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Platform Bölümleri
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Platform Bölümleri", {
    x: 0.5, y: 0.18, w: 9, h: 0.62,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  const sections = [
    { emoji: "🍽️", title: "Günün Menüsü",    desc: "Her gün özel hazırlanmış 4 bölümlü günlük menüler.", yakinda: false },
    { emoji: "📅", title: "Dünün Menüsü",    desc: "Geçmiş menü arşivi — fikir bankası ve tarih kaydı.", yakinda: false },
    { emoji: "📖", title: "Tarifler",         desc: "4 kategoride organize edilmiş kapsamlı tarif sistemi.", yakinda: false },
    { emoji: "✍️", title: "Blog",             desc: "Mutfak rehberleri, yemek kültürü ve püf noktaları.", yakinda: false },
    { emoji: "✨", title: "Menü Oluştur",     desc: "Kişisel menü oluştur, sosyal medyada direkt paylaş.", yakinda: false },
    { emoji: "📚", title: "Defterim",          desc: "Beğendiğin tarif ve içerikleri kaydet, kişisel koleksiyonunu oluştur.", yakinda: false },
  ];

  sections.forEach((sec, i) => {
    const y = 0.95 + i * 0.72;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.62, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.06, h: 0.62, fill: { color: C.orange } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.04, fill: { color: C.orange } });

    s.addText(sec.emoji, { x: 0.65, y: y + 0.06, w: 0.65, h: 0.46, fontSize: 22, align: "center", margin: 0 });
    s.addText(sec.title, { x: 1.38, y: y + 0.06, w: sec.yakinda ? 1.9 : 2.5, h: 0.28, fontSize: 13, bold: true, color: C.dark, fontFace: "Calibri", margin: 0 });
    s.addText(sec.desc,  { x: 1.38, y: y + 0.33, w: sec.yakinda ? 7.1 : 7.9, h: 0.24, fontSize: 11, color: C.medium, fontFace: "Calibri", margin: 0 });

    if (sec.yakinda) {
      s.addShape(pres.shapes.RECTANGLE, { x: 3.3, y: y + 0.1, w: 1.0, h: 0.22, fill: { color: C.orange } });
      s.addText("Yakında", { x: 3.3, y: y + 0.11, w: 1.0, h: 0.2, fontSize: 8.5, bold: true, color: C.white, align: "center", fontFace: "Calibri", margin: 0 });
    }
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Günün Menüsü Sistemi
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Günün Menüsü", {
    x: 0.5, y: 0.2, w: 7, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });
  s.addText("Platformun kalbi.", {
    x: 0.5, y: 0.9, w: 4, h: 0.35,
    fontSize: 15, italic: true, color: C.orange, fontFace: "Calibri", margin: 0,
  });

  // 2x2 card grid — emoji centered at top, content below
  const cards = [
    { emoji: "🍲", title: "Çorba",           desc: "Her güne sıcak ve doyurucu bir başlangıç yapılır.",        x: 0.4,  y: 1.4 },
    { emoji: "🥘", title: "Ana Yemek",        desc: "Günün özenle seçilmiş, en doyurucu lezzeti sofrada yerini alır.",     x: 3.05, y: 1.4 },
    { emoji: "🥗", title: "Yardımcı Lezzet",  desc: "Ana yemeğe eşlik eden, sofrayı dengeleyen özel bir seçim.",    x: 0.4,  y: 2.9 },
    { emoji: "🍮", title: "Tatlı",            desc: "Güzel bir sofranın en tatlı kapanışı, günün son lezzeti.",   x: 3.05, y: 2.9 },
  ];

  cards.forEach(c => {
    s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: 2.45, h: 1.3, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: c.x, y: c.y, w: 2.45, h: 0.06, fill: { color: C.orange } });
    // Emoji — centered left column
    s.addText(c.emoji, { x: c.x + 0.08, y: c.y + 0.2, w: 0.75, h: 0.75, fontSize: 30, align: "center", valign: "middle", margin: 0 });
    s.addText(c.title, { x: c.x + 0.88, y: c.y + 0.2, w: 1.48, h: 0.35, fontSize: 14, bold: true, color: C.dark, fontFace: "Calibri", margin: 0 });
    s.addText(c.desc,  { x: c.x + 0.88, y: c.y + 0.57, w: 1.48, h: 0.55, fontSize: 11, color: C.medium, fontFace: "Calibri", margin: 0 });
  });

  // Callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.5, w: 5.15, h: 0.72, fill: { color: C.accent } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.5, w: 0.07, h: 0.72, fill: { color: C.orange } });
  s.addText("Günün Menüsü, yazar adı içeren özel şablonlarla birlikte Menü Günlüğü ve Hikayeli Yemekler sosyal medya hesaplarında düzenli olarak paylaşılır.", {
    x: 0.6, y: 4.54, w: 4.75, h: 0.62, fontSize: 11.5, color: C.dark, fontFace: "Calibri", margin: 0,
  });

  // Right panel: flow diagram
  s.addShape(pres.shapes.RECTANGLE, { x: 5.75, y: 1.2, w: 3.8, h: 3.95, fill: { color: C.dark } });

  const flowItems = [
    { icon: "📋", label: "Günlük Menü",   sub: "Her gün dört kategoriden oluşan, özenle hazırlanmış bir menü yayınlanır." },
    { icon: "📱", label: "Sosyal Medya",  sub: "Menü, yazar adını içeren özel bir şablonla sosyal medyada paylaşılır." },
    { icon: "👁️",  label: "Görünürlük",   sub: "Hem yazarlar hem de kullanıcılar geniş bir kitleye ulaşır." },
  ];
  flowItems.forEach((f, i) => {
    const y = 1.38 + i * 1.15;
    s.addShape(pres.shapes.OVAL, { x: 5.95, y, w: 0.55, h: 0.55, fill: { color: C.orange } });
    s.addText(f.icon, { x: 5.95, y, w: 0.55, h: 0.55, fontSize: 18, align: "center", valign: "middle", margin: 0 });
    s.addText(f.label, { x: 6.62, y: y + 0.02, w: 2.7, h: 0.3, fontSize: 13, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
    s.addText(f.sub,   { x: 6.62, y: y + 0.35, w: 2.7, h: 0.58, fontSize: 10.5, color: "B8A090", fontFace: "Calibri", margin: 0 });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: 6.21, y: y + 0.6, w: 0, h: 0.5, line: { color: C.orange, width: 2, dashType: "dash" } });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Menü Oluştur
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  // Badge
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.2, w: 1.9, h: 0.38, fill: { color: C.orange } });
  s.addText("✨ En Özel Özellik", { x: 0.55, y: 0.22, w: 1.8, h: 0.34, fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });

  s.addText("Menü Oluştur", {
    x: 0.5, y: 0.68, w: 5.5, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  const steps = [
    "Sistemdeki tariflerden seçim yap.",
    "Günlük menünü oluştur.",
    "Sosyal medyada direkt paylaş (Post / Story).",
    "PDF tarif kataloğu oluştur.",
  ];

  steps.forEach((step, i) => {
    const y = 1.55 + i * 0.82;
    s.addShape(pres.shapes.OVAL, { x: 0.5, y, w: 0.5, h: 0.5, fill: { color: C.orange } });
    s.addText(String(i + 1), { x: 0.5, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.15, y: y + 0.05, w: 4.35, h: 0.42, fill: { color: C.white }, shadow: makeShadow() });
    s.addText(step, { x: 1.3, y: y + 0.08, w: 4.05, h: 0.35, fontSize: 13, color: C.dark, fontFace: "Calibri", margin: 0 });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: 0.74, y: y + 0.55, w: 0, h: 0.22, line: { color: C.orange, width: 1.5, dashType: "dash" } });
  });

  // ── Single large social media post preview ──
  const PX = 6.0, PY = 0.82, PW = 3.5, PH = 4.05;

  // Card outer
  s.addShape(pres.shapes.RECTANGLE, { x: PX, y: PY, w: PW, h: PH, fill: { color: C.dark }, shadow: makeShadow() });

  // Orange header
  s.addShape(pres.shapes.RECTANGLE, { x: PX, y: PY, w: PW, h: 0.58, fill: { color: C.orange } });
  s.addText("GÜNÜN MENÜSÜ", { x: PX, y: PY + 0.06, w: PW, h: 0.22, fontSize: 10, bold: true, color: C.white, align: "center", fontFace: "Calibri", margin: 0 });
  s.addText("Pazartesi, 28 Nisan  •  menugunlugu.com", { x: PX, y: PY + 0.3, w: PW, h: 0.18, fontSize: 7.5, color: "FDF0E6", align: "center", fontFace: "Calibri", margin: 0 });

  // 4 menu items
  const menuItems = [
    { emoji: "🍲", cat: "ÇORBA",        name: "Mercimek Çorbası" },
    { emoji: "🥘", cat: "ANA YEMEK",   name: "Kuru Fasulye" },
    { emoji: "🥗", cat: "YARDIMCI",    name: "Cacık" },
    { emoji: "🍮", cat: "TATLI",       name: "Sütlaç" },
  ];
  menuItems.forEach((item, i) => {
    const iy = PY + 0.74 + i * 0.76;
    s.addShape(pres.shapes.RECTANGLE, { x: PX + 0.12, y: iy, w: PW - 0.24, h: 0.64, fill: { color: "2A1C12" } });
    s.addShape(pres.shapes.RECTANGLE, { x: PX + 0.12, y: iy, w: 0.05, h: 0.64, fill: { color: C.orange } });
    // Category (small label)
    s.addText(item.cat, { x: PX + 0.25, y: iy + 0.05, w: 2.4, h: 0.18, fontSize: 7.5, bold: true, color: C.orange, fontFace: "Calibri", margin: 0 });
    // Dish name
    s.addText(item.name, { x: PX + 0.25, y: iy + 0.26, w: 2.4, h: 0.28, fontSize: 12, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
    // Emoji (right side)
    s.addText(item.emoji, { x: PX + PW - 0.62, y: iy + 0.1, w: 0.5, h: 0.46, fontSize: 22, align: "center", valign: "middle", margin: 0 });
  });

  // Author footer
  const fy = PY + PH - 0.4;
  s.addShape(pres.shapes.RECTANGLE, { x: PX, y: fy, w: PW, h: 0.4, fill: { color: "221508" } });
  s.addText("@yazar_adi", { x: PX + 0.15, y: fy + 0.1, w: 1.6, h: 0.22, fontSize: 9.5, bold: true, color: C.orange, fontFace: "Calibri", margin: 0 });
  s.addText("menugunlugu.com", { x: PX + 1.8, y: fy + 0.1, w: 1.55, h: 0.22, fontSize: 9, color: "B8A090", fontFace: "Calibri", align: "right", margin: 0 });

  // Format label below
  s.addShape(pres.shapes.RECTANGLE, { x: PX, y: PY + PH + 0.1, w: PW, h: 0.24, fill: { color: C.accent } });
  s.addText("Post  1080×1350  ·  Story  1080×1920", { x: PX, y: PY + PH + 0.12, w: PW, h: 0.2, fontSize: 8.5, color: C.medium, align: "center", fontFace: "Calibri", margin: 0 });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Yapay Zekâ (Yakında)
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: "F0EBE4" };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addShape(pres.shapes.RECTANGLE, { x: 7.5, y: 0.22, w: 2.1, h: 0.44, fill: { color: C.orange } });
  s.addText("🚀 Çok Yakında", { x: 7.52, y: 0.24, w: 2.06, h: 0.4, fontSize: 12, bold: true, color: C.white, align: "center", margin: 0 });

  s.addText("Yapay Zekâ Destekli\nYemek Öneri Sistemi", {
    x: 0.5, y: 0.2, w: 6.8, h: 1.1,
    fontSize: 30, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  s.addShape(pres.shapes.OVAL, { x: 4.25, y: 1.45, w: 1.5, h: 1.5, fill: { color: C.orange } });
  s.addText("🤖", { x: 4.25, y: 1.45, w: 1.5, h: 1.5, fontSize: 52, align: "center", valign: "middle", margin: 0 });

  s.addText('"Evdeki malzemelerini seç, sana özel yemek önerileri al."', {
    x: 1.0, y: 3.1, w: 8.0, h: 0.55,
    fontSize: 16, italic: true, bold: true, color: C.dark, fontFace: "Georgia", align: "center", margin: 0,
  });

  const flowSteps = [
    { emoji: "🛒", label: "Malzeme Seç" },
    { emoji: "🤖", label: "Yapay Zekâ" },
    { emoji: "🍳", label: "Tarif Önerisi" },
  ];

  flowSteps.forEach((step, i) => {
    const x = 1.3 + i * 2.8;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.85, w: 2.2, h: 1.1, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.85, w: 2.2, h: 0.06, fill: { color: C.orange } });
    s.addText(step.emoji, { x, y: 3.98, w: 2.2, h: 0.55, fontSize: 28, align: "center", margin: 0 });
    s.addText(step.label, { x, y: 4.55, w: 2.2, h: 0.35, fontSize: 12, bold: true, color: C.dark, align: "center", fontFace: "Calibri", margin: 0 });
    if (i < 2) s.addText("→", { x: x + 2.22, y: 4.05, w: 0.55, h: 0.75, fontSize: 24, color: C.orange, align: "center", valign: "middle", margin: 0 });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 8 — Günün Restoranı (Yakında)
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.2, w: 1.7, h: 0.38, fill: { color: C.darkOrange } });
  s.addText("🏪 Yakında", { x: 0.55, y: 0.22, w: 1.6, h: 0.34, fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });

  s.addText("Günün Restoranı", {
    x: 0.5, y: 0.68, w: 7, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });
  s.addText("Restoran öner, en iyi yemeklerden paylaşılabilir restoran menüsü oluştur.", {
    x: 0.5, y: 1.38, w: 9, h: 0.35,
    fontSize: 14, italic: true, color: C.orange, fontFace: "Calibri", margin: 0,
  });

  const restoranSteps = [
    { num: "1", emoji: "📍", title: "Restoran Öner",      desc: "Kullanıcılar sevdikleri restoranları platforma ekler ve toplulukla paylaşır." },
    { num: "2", emoji: "⭐", title: "En İyi Yemekler",    desc: "Restoranın en çok beğenilen yemekleri oylanarak listelenir." },
    { num: "3", emoji: "📋", title: "Menü Oluşturulur",   desc: "Seçilen yemeklerden paylaşılabilir bir restoran menüsü otomatik olarak hazırlanır." },
    { num: "4", emoji: "📱", title: "Paylaş & Yorum Yap", desc: "Menü sosyal medyada paylaşılır, topluluk yorum yaparak deneyimini aktarır." },
  ];

  restoranSteps.forEach((step, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 4.85;
    const y = 1.88 + row * 1.55;

    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 1.35, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 0.06, fill: { color: C.orange } });

    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.28, w: 0.55, h: 0.55, fill: { color: C.orange } });
    s.addText(step.num, { x: x + 0.15, y: y + 0.28, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });

    s.addText(step.emoji + "  " + step.title, { x: x + 0.85, y: y + 0.1, w: 3.5, h: 0.38, fontSize: 13, bold: true, color: C.dark, fontFace: "Calibri", margin: 0 });
    s.addText(step.desc, { x: x + 0.85, y: y + 0.52, w: 3.5, h: 0.7, fontSize: 11, color: C.medium, fontFace: "Calibri", margin: 0 });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 9 — Menü Günlüğü Ekosistemi
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Menü Günlüğü Ekosistemi", {
    x: 0.5, y: 0.1, w: 6.3, h: 0.65,
    fontSize: 30, bold: true, color: C.white, fontFace: "Georgia", valign: "middle", margin: 0,
  });

  // Mobile app — top right badge, centered within title frame
  s.addShape(pres.shapes.RECTANGLE, { x: 7.05, y: 0.2, w: 2.7, h: 0.46, fill: { color: C.darkOrange } });
  s.addText("📱  Mobil Uygulama  ·  Yakında", {
    x: 7.05, y: 0.2, w: 2.7, h: 0.46,
    fontSize: 11, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0,
  });

  // Center node
  s.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 1.95, w: 3.0, h: 1.2, fill: { color: C.orange }, shadow: makeShadow() });
  s.addText("Menü\nGünlüğü", { x: 3.5, y: 1.95, w: 3.0, h: 1.2, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Georgia", margin: 0 });

  // Spoke nodes
  s.addShape(pres.shapes.RECTANGLE, { x: 0.2,  y: 2.15, w: 2.7, h: 0.8, fill: { color: "2A1C12" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.2,  y: 2.15, w: 2.7, h: 0.05, fill: { color: C.orange } });
  s.addText("✍️  Yazarlar", { x: 0.2, y: 2.15, w: 2.7, h: 0.8, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 7.1,  y: 2.15, w: 2.7, h: 0.8, fill: { color: "2A1C12" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.1,  y: 2.15, w: 2.7, h: 0.05, fill: { color: C.orange } });
  s.addText("👥  Kullanıcılar", { x: 7.1, y: 2.15, w: 2.7, h: 0.8, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 3.75, y: 0.9,  w: 2.5, h: 0.75, fill: { color: "2A1C12" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.75, y: 0.9,  w: 2.5, h: 0.05, fill: { color: C.orange } });
  s.addText("📖  Tarifler\n& Menüler", { x: 3.75, y: 0.9, w: 2.5, h: 0.75, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });

  s.addShape(pres.shapes.RECTANGLE, { x: 3.75, y: 3.45, w: 2.5, h: 0.75, fill: { color: "2A1C12" }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.75, y: 3.45, w: 2.5, h: 0.05, fill: { color: C.orange } });
  s.addText("📱  Sosyal Medya", { x: 3.75, y: 3.45, w: 2.5, h: 0.75, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });

  // Connecting lines
  s.addShape(pres.shapes.LINE, { x: 2.9,  y: 2.55, w: 0.6,  h: 0, line: { color: C.orange, width: 2, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 6.5,  y: 2.55, w: 0.6,  h: 0, line: { color: C.orange, width: 2, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 5.0,  y: 1.65, w: 0,    h: 0.3, line: { color: C.orange, width: 2, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: 5.0,  y: 3.15, w: 0,    h: 0.3, line: { color: C.orange, width: 2, dashType: "dash" } });

  // Description — mentions Hikayeli Yemekler
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.42, w: 9.2, h: 0.68, fill: { color: "2A1C12" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.42, w: 0.05, h: 0.68, fill: { color: C.orange } });
  s.addText("Hikayeli Yemekler çatısı altında hayata geçen Menü Günlüğü; içerik üreticilerini, kullanıcıları ve markaları tek bir gastronomi platformunda bir araya getirmeyi hedefleyen yeni nesil bir gastronomi platformudur.", {
    x: 0.58, y: 4.45, w: 8.8, h: 0.6, fontSize: 12, color: "B8A090", fontFace: "Calibri", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.37, w: 10, h: 0.25, fill: { color: C.orange } });
  s.addText("menugunlugu.com", { x: 0.35, y: 5.39, w: 4, h: 0.21, fontSize: 10, color: C.white, fontFace: "Calibri", margin: 0 });
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 10 — Kullanıcı Deneyimi
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Kullanıcı Deneyimi", {
    x: 0.5, y: 0.2, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });

  const features = [
    { emoji: "📚", title: "Defterim",                desc: "Beğendiğin tarif ve yazıları kaydet, kendi koleksiyonunu oluştur." },
    { emoji: "💬", title: "Yorum & Değerlendirme",   desc: "Tarif ve yazılara yorum ekle, tarifleri puanla." },
    { emoji: "👥", title: "Takip Sistemi",            desc: "Yazarları takip et, yeni içeriklerini kaçırma." },
    { emoji: "⚖️",  title: "Porsiyon Ölçeklendirme", desc: "2, 4 veya 8 kişilik otomatik malzeme hesaplama." },
    { emoji: "✨", title: "Menü Oluştur",             desc: "Kişisel günlük menünü oluştur, sosyal medyada direkt paylaş." },
    { emoji: "🗓️", title: "Günlük Menü Takibi",      desc: "Her gün yeni menüyü keşfet, tarif detaylarına bak, sofranı planla." },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 4.85;
    const y = 1.15 + row * 1.35;

    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 1.15, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 0.05, fill: { color: C.orange } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.27, w: 0.6, h: 0.6, fill: { color: C.accent } });
    s.addText(f.emoji, { x: x + 0.15, y: y + 0.27, w: 0.6, h: 0.6, fontSize: 22, align: "center", valign: "middle", margin: 0 });
    s.addText(f.title, { x: x + 0.88, y: y + 0.15, w: 3.5, h: 0.35, fontSize: 12.5, bold: true, color: C.dark, fontFace: "Calibri", margin: 0 });
    s.addText(f.desc,  { x: x + 0.88, y: y + 0.52, w: 3.5, h: 0.5, fontSize: 11, color: C.medium, fontFace: "Calibri", margin: 0 });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 11 — Menü Günlüğünde Yazar Olmak
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("Menü Günlüğünde Yazar Olmak", {
    x: 0.5, y: 0.2, w: 9, h: 0.7,
    fontSize: 30, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });
  s.addText("Yalnızca paylaşmak değil — görünür olmak.", {
    x: 0.5, y: 0.88, w: 7, h: 0.35,
    fontSize: 15, italic: true, color: C.orange, fontFace: "Calibri", margin: 0,
  });

  // 3 benefit cards — Defterim replaced by Yazar Kartı
  const benefits = [
    { emoji: "👤", title: "Yazar Kartı",        desc: "Profil sayfanız, sosyal medya hesaplarınız ve takipçi sisteminiz tek bir yerden." },
    { emoji: "🌟", title: "Günün Menüsü'nde",   desc: "Tarifleriniz platformun ana akışında görünsün." },
    { emoji: "📱", title: "Sosyal Medya",        desc: "Seçilen tarifler yazar adınızla sosyal medya paylaşımlarında yer alır." },
  ];

  benefits.forEach((b, i) => {
    const x = 0.4 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.9, h: 2.15, fill: { color: C.white }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.9, h: 0.07, fill: { color: C.orange } });
    s.addShape(pres.shapes.OVAL, { x: x + 1.15, y: 1.6, w: 0.62, h: 0.62, fill: { color: C.accent } });
    s.addText(b.emoji, { x: x + 1.15, y: 1.6, w: 0.62, h: 0.62, fontSize: 22, align: "center", valign: "middle", margin: 0 });
    s.addText(b.title, { x: x + 0.1, y: 2.35, w: 2.7, h: 0.38, fontSize: 13, bold: true, color: C.dark, fontFace: "Calibri", align: "center", margin: 0 });
    s.addText(b.desc,  { x: x + 0.15, y: 2.76, w: 2.6, h: 0.68, fontSize: 11, color: C.medium, fontFace: "Calibri", align: "center", margin: 0 });
  });

  // Bottom dark bar — platform overview
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 3.72, w: 9.2, h: 1.48, fill: { color: C.dark } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 3.72, w: 0.07, h: 1.48, fill: { color: C.orange } });
  s.addText("📊  Yazar Analitiği", { x: 0.6, y: 3.79, w: 3.0, h: 0.35, fontSize: 14, bold: true, color: C.orange, fontFace: "Calibri", margin: 0 });
  s.addText("Tarif görüntüleme  •  Beğeni sayısı  •  Takipçi istatistikleri  •  Menü paylaşım performansı.", {
    x: 0.6, y: 4.17, w: 8.8, h: 0.3, fontSize: 12, color: "FDF0E6", fontFace: "Calibri", margin: 0,
  });
  s.addText("Menü Günlüğü; mutfak odaklı içerik üreticileri için aktif bir paylaşım ve büyüme platformudur.", {
    x: 0.6, y: 4.52, w: 8.8, h: 0.5, fontSize: 11, color: "B8A090", fontFace: "Calibri", italic: true, margin: 0,
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 12 — İş Birlikleri
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.light };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.orange } });

  s.addText("İş Birlikleri & Marka Fırsatları", {
    x: 0.5, y: 0.2, w: 9, h: 0.7,
    fontSize: 30, bold: true, color: C.dark, fontFace: "Georgia", margin: 0,
  });
  s.addText("İçerik üreticileri, markalar ve yemek toplulukları için.", {
    x: 0.5, y: 0.88, w: 9, h: 0.32,
    fontSize: 14, italic: true, color: C.orange, fontFace: "Calibri", margin: 0,
  });

  // Left column — dark background
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.35, w: 4.25, h: 3.85, fill: { color: C.dark }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.35, w: 4.25, h: 0.5, fill: { color: C.orange } });
  s.addText("🏷️  Markalar İçin", { x: 0.6, y: 1.38, w: 4.0, h: 0.44, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });

  const brandItems = [
    "Sponsorlu menü içerikleri.",
    "Tarif entegrasyonları.",
    "Hedef kitleye doğrudan ulaşım.",
    "Sosyal medya kampanyaları.",
    "Ürün deneyim çalışmaları.",
  ];
  brandItems.forEach((item, i) => {
    const iy = 2.08 + i * 0.56;
    s.addShape(pres.shapes.OVAL, { x: 0.63, y: iy, w: 0.18, h: 0.18, fill: { color: C.orange } });
    s.addText(item, { x: 0.94, y: iy - 0.04, w: 3.5, h: 0.28, fontSize: 12, color: "FDF0E6", fontFace: "Calibri", valign: "middle", margin: 0 });
  });

  // Right column — white background
  s.addShape(pres.shapes.RECTANGLE, { x: 5.35, y: 1.35, w: 4.25, h: 3.85, fill: { color: C.white }, shadow: makeShadow() });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.35, y: 1.35, w: 4.25, h: 0.5, fill: { color: C.darkOrange } });
  s.addText("✍️  İçerik Üreticileri İçin", { x: 5.5, y: 1.38, w: 4.0, h: 0.44, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });

  const creatorItems = [
    "Workshop etkinlikleri.",
    "Görünürlük ve takipçi büyümesi.",
    "Özel davet ve etkinlikler.",
    "İçerik ortaklıkları.",
    "Platform içi öne çıkma.",
  ];
  creatorItems.forEach((item, i) => {
    const iy = 2.08 + i * 0.56;
    s.addShape(pres.shapes.OVAL, { x: 5.56, y: iy, w: 0.18, h: 0.18, fill: { color: C.darkOrange } });
    s.addText(item, { x: 5.87, y: iy - 0.04, w: 3.5, h: 0.28, fontSize: 12, color: C.dark, fontFace: "Calibri", valign: "middle", margin: 0 });
  });

  footer(s);
}

// ════════════════════════════════════════════════════════════════════════
// SLIDE 13 — Kapanış
// ════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: "3D2B1F" };

  // Right panel — cream (matches logo background)
  s.addShape(pres.shapes.RECTANGLE, { x: 6.5, y: 0, w: 3.5, h: 5.625, fill: { color: C.logoBg } });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.42, y: 0, w: 0.08, h: 5.625, fill: { color: C.orange } });

  // Subtle top decorative line
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.65, w: 4.5, h: 0.015, fill: { color: "5C3D2A" } });

  // Left content
  s.addText("Menü Günlüğü", {
    x: 0.5, y: 0.85, w: 5.7, h: 0.95,
    fontSize: 46, bold: true, color: C.white, fontFace: "Georgia", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.88, w: 2.5, h: 0.07, fill: { color: C.orange } });

  s.addText("Her gün yeni bir menü.", {
    x: 0.5, y: 2.08, w: 5.7, h: 0.5,
    fontSize: 22, color: C.white, fontFace: "Calibri", margin: 0,
  });
  s.addText("Her sofraya yeni bir fikir.", {
    x: 0.5, y: 2.62, w: 5.7, h: 0.5,
    fontSize: 22, color: C.orange, fontFace: "Calibri", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.3, w: 4.0, h: 0.04, fill: { color: "5C3D2A" } });

  s.addText("menugunlugu.com", {
    x: 0.5, y: 3.45, w: 5.7, h: 0.4,
    fontSize: 16, color: "C8A07A", fontFace: "Calibri", margin: 0,
  });

  // Right panel — logo seamless on cream
  s.addImage({ path: LOGO, x: 6.62, y: 0.55, w: 3.2, h: 3.2 });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, { x: 6.75, y: 3.9, w: 2.6, h: 0.04, fill: { color: "C0A078" } });

  // Contact info (dark text on cream bg)
  s.addText("İletişim", { x: 6.65, y: 4.0, w: 3.1, h: 0.35, fontSize: 12, bold: true, color: C.orange, align: "center", margin: 0 });

  const contacts = [
    { icon: "🌐", text: "menugunlugu.com" },
    { icon: "📷", text: "@menugunlugu" },
    { icon: "✉️",  text: "info@menugunlugu.com" },
  ];
  contacts.forEach((c, i) => {
    const y = 4.42 + i * 0.37;
    s.addText(c.icon, { x: 6.65, y, w: 0.5, h: 0.32, fontSize: 14, align: "center", margin: 0 });
    s.addText(c.text, { x: 7.18, y: y + 0.03, w: 2.8, h: 0.26, fontSize: 10, color: C.dark, fontFace: "Calibri", margin: 0 });
  });
}

// ════════════════════════════════════════════════════════════════════════
// SAVE
// ════════════════════════════════════════════════════════════════════════
pres.writeFile({ fileName: "/Users/hikayeliyemekler/menugunlugu/menugunlugu-tanitim.pptx" })
  .then(() => console.log("✅ Saved: menugunlugu-tanitim.pptx"))
  .catch(err => { console.error("❌ Error:", err); process.exit(1); });
