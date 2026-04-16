import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/* ── Font registration (lazy, CDN URL — full Turkish support) ── */
let _fontsReady = false;

export function ensureFonts(siteUrl: string) {
  if (_fontsReady) return;
  const base = siteUrl.replace(/\/$/, "");
  Font.register({
    family: "Roboto",
    fonts: [
      { src: `${base}/fonts/Roboto-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/Roboto-Medium.ttf`,  fontWeight: 500 },
      { src: `${base}/fonts/Roboto-Bold.ttf`,    fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  _fontsReady = true;
}

/* ── Brand palette ───────────────────────────────────────────── */
const C = {
  brand:      "#d97706",
  brandDark:  "#92400e",
  brandLight: "#fef3e2",
  brandMid:   "#fde68a",
  white:      "#ffffff",
  text:       "#1c1917",
  textMid:    "#44403c",
  muted:      "#78716c",
  line:       "#e7e5e4",
};

/* ── Helpers ─────────────────────────────────────────────────── */
const bold   = (extra?: object) => ({ fontFamily: "Roboto", fontWeight: 700, ...extra });
const medium = (extra?: object) => ({ fontFamily: "Roboto", fontWeight: 500, ...extra });
const reg    = (extra?: object) => ({ fontFamily: "Roboto", fontWeight: 400, ...extra });

/* ── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: "Roboto", fontWeight: 400, fontSize: 10, color: C.text },

  /* ── Cover ───────────────────── */
  coverBand: { backgroundColor: C.brand, paddingTop: 48, paddingBottom: 48, paddingLeft: 44, paddingRight: 44 },
  coverSite: { ...bold(), fontSize: 8, color: C.brandLight, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 },
  coverTitle: { ...bold(), fontSize: 42, color: C.white, marginBottom: 6 },
  coverDate: { ...reg(), fontSize: 12, color: C.brandLight },
  coverAccent: { height: 4, backgroundColor: C.brandDark },
  coverBody: { paddingTop: 28, paddingBottom: 60, paddingLeft: 44, paddingRight: 44 },

  mealCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 8,
    borderWidth: 1, borderColor: C.brandMid, borderStyle: "solid",
    marginBottom: 12, overflow: "hidden",
  },
  mealThumb: { width: 72, height: 72, flexShrink: 0, backgroundColor: C.brandLight },
  mealThumbPlaceholder: { width: 72, height: 72, flexShrink: 0, backgroundColor: C.brandLight, alignItems: "center", justifyContent: "center" },
  mealAccent: { width: 4, height: "100%", backgroundColor: C.brand, flexShrink: 0 },
  mealInfo: { paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, flex: 1 },
  mealLabel: { ...bold(), fontSize: 7, color: C.brand, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 },
  mealTitle: { ...bold(), fontSize: 14, color: C.text, marginBottom: 2 },
  mealAuthor: { ...reg(), fontSize: 8, color: C.muted },

  /* ── Section band ────────────── */
  sectionBand: {
    backgroundColor: C.brand, paddingTop: 18, paddingBottom: 18,
    paddingLeft: 44, paddingRight: 44,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  sectionLabel: { ...bold(), fontSize: 7, color: C.brandLight, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 },
  sectionTitle: { ...bold(), fontSize: 20, color: C.white },
  sectionRight: { ...reg(), fontSize: 8, color: C.brandLight, textAlign: "right" },
  sectionAccent: { height: 4, backgroundColor: C.brandDark },

  /* ── Recipe hero image ───────── */
  heroImage: { width: "100%", height: 160, objectFit: "cover" },
  heroPlaceholder: { width: "100%", height: 80, backgroundColor: C.brandLight },

  /* ── Body ────────────────────── */
  body: { paddingTop: 22, paddingBottom: 60, paddingLeft: 44, paddingRight: 44 },
  recipeMeta: { ...reg(), fontSize: 8.5, color: C.muted, marginBottom: 18 },

  /* ── Two columns ─────────────── */
  cols: { flexDirection: "row", gap: 24 },
  colLeft: { width: "37%" },
  colRight: { flex: 1 },
  colHeading: {
    ...bold(), fontSize: 7, color: C.brand, letterSpacing: 1.5, textTransform: "uppercase",
    marginBottom: 8, paddingBottom: 5,
    borderBottomWidth: 1, borderBottomColor: C.brandMid, borderBottomStyle: "solid",
  },

  /* ── Ingredients ─────────────── */
  ingRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  ingBullet: { width: 5, height: 5, backgroundColor: C.brand, borderRadius: 3, marginRight: 8, marginTop: 3, flexShrink: 0 },
  ingText: { ...reg(), fontSize: 9, color: C.textMid, flex: 1, lineHeight: 1.4 },

  /* ── Steps ───────────────────── */
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 9 },
  stepBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.brandLight, borderWidth: 1, borderColor: C.brandMid, borderStyle: "solid",
    alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 1, flexShrink: 0,
  },
  stepNum: { ...bold(), fontSize: 7, color: C.brand },
  stepText: { ...reg(), fontSize: 9, color: C.textMid, flex: 1, lineHeight: 1.5 },

  /* ── Shopping list ───────────── */
  shopRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, width: "50%", paddingRight: 16 },
  shopBox: { width: 10, height: 10, borderWidth: 1.2, borderColor: C.muted, borderStyle: "solid", borderRadius: 2, marginRight: 8, marginTop: 1, flexShrink: 0 },
  shopText: { ...reg(), fontSize: 9.5, color: C.textMid, flex: 1, lineHeight: 1.4 },

  /* ── Footer ──────────────────── */
  footer: {
    position: "absolute", bottom: 18, left: 44, right: 44,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 0.5, borderTopColor: C.line, borderTopStyle: "solid", paddingTop: 6,
  },
  footerSite: { ...bold(), fontSize: 7.5, color: C.brand },
  footerInfo: { ...reg(), fontSize: 7.5, color: C.muted },
});

/* ── Types ───────────────────────────────────────────────────── */
export interface PdfRecipeData {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  ingredients: string[];
  instructions: string[];
  servings: number | null;
  author: string;
  authorUrl: string;
}

interface Props {
  recipes: { soup: PdfRecipeData; main: PdfRecipeData; side: PdfRecipeData; dessert: PdfRecipeData };
  allIngredients: string[];
  dateStr: string;
}

const SLOTS = [
  { key: "soup"    as const, label: "Çorba",           cat: "ÇORBA" },
  { key: "main"    as const, label: "Ana Yemek",        cat: "ANA YEMEK" },
  { key: "side"    as const, label: "Yardımcı Lezzet",  cat: "YARDIMCI LEZZET" },
  { key: "dessert" as const, label: "Tatlı",            cat: "TATLI" },
];

/* ── Document ────────────────────────────────────────────────── */
export function MenuPdfDocument({ recipes, allIngredients, dateStr }: Props) {
  return (
    <Document title="Gunun Menusu" author="Menu Gunlugu" language="tr">

      {/* ══════════════════════════════════════════════════════════
          SAYFA 1 — KAPAK
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBand}>
          <Text style={s.coverSite}>menugunlugu.com</Text>
          <Text style={s.coverTitle}>{"G\u00FCn\u00FCn Men\u00FCs\u00FC"}</Text>
          <Text style={s.coverDate}>{dateStr}</Text>
        </View>
        <View style={s.coverAccent} />

        <View style={s.coverBody}>
          {SLOTS.map(({ key, label, labelTR }) => {
            const r = recipes[key];
            return (
              <View key={key} style={s.mealCard}>
                {/* Thumbnail */}
                {r.image_url ? (
                  <Image src={r.image_url} style={s.mealThumb} />
                ) : (
                  <View style={s.mealThumbPlaceholder} />
                )}
                {/* Accent */}
                <View style={s.mealAccent} />
                {/* Info */}
                <View style={s.mealInfo}>
                  <Text style={s.mealLabel}>{label}</Text>
                  <Text style={s.mealTitle}>{r.title}</Text>
                  {r.author ? <Text style={s.mealAuthor}>Yazar: {r.author}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.footer}>
          <Text style={s.footerSite}>menugunlugu.com</Text>
          <Text style={s.footerInfo}>{"G\u00FCn\u00FCn Men\u00FCs\u00FC \u00B7 "}{dateStr}</Text>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          SAYFALAR 2-5 — TARİFLER
      ══════════════════════════════════════════════════════════ */}
      {SLOTS.map(({ key, label, cat }) => {
        const r = recipes[key];
        return (
          <Page key={key} size="A4" style={s.page}>
            {/* Section band */}
            <View style={s.sectionBand}>
              <View>
                <Text style={s.sectionLabel}>{cat}</Text>
                <Text style={s.sectionTitle}>{r.title}</Text>
              </View>
              {r.servings ? <Text style={s.sectionRight}>{r.servings} kisilik</Text> : null}
            </View>
            <View style={s.sectionAccent} />

            {/* Hero image */}
            {r.image_url ? (
              <Image src={r.image_url} style={s.heroImage} />
            ) : (
              <View style={s.heroPlaceholder} />
            )}

            <View style={s.body}>
              {r.author ? (
                <Text style={s.recipeMeta}>
                  Yazar: {r.author}{r.authorUrl ? `  ·  ${r.authorUrl}` : ""}
                </Text>
              ) : null}

              <View style={s.cols}>
                {/* Malzemeler */}
                <View style={s.colLeft}>
                  <Text style={s.colHeading}>Malzemeler</Text>
                  {r.ingredients.map((item, i) => (
                    <View key={i} style={s.ingRow}>
                      <View style={s.ingBullet} />
                      <Text style={s.ingText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Yapilisi */}
                <View style={s.colRight}>
                  <Text style={s.colHeading}>{"Yap\u0131l\u0131\u015F\u0131"}</Text>
                  {r.instructions.map((step, i) => (
                    <View key={i} style={s.stepRow}>
                      <View style={s.stepBadge}>
                        <Text style={s.stepNum}>{i + 1}</Text>
                      </View>
                      <Text style={s.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={s.footer}>
              <Text style={s.footerSite}>menugunlugu.com</Text>
              <Text style={s.footerInfo}>{label} · {dateStr}</Text>
            </View>
          </Page>
        );
      })}

      {/* ══════════════════════════════════════════════════════════
          SAYFA 6 — ALIŞVERİŞ LİSTESİ (SON SAYFA)
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.sectionBand}>
          <View>
            <Text style={s.sectionLabel}>{"Men\u00FC G\u00FCnl\u00FC\u011F\u00FC"}</Text>
            <Text style={s.sectionTitle}>{"Al\u0131\u015Fveri\u015F Listesi"}</Text>
          </View>
          <Text style={s.sectionRight}>{dateStr}{"\n"}{allIngredients.length} malzeme</Text>
        </View>
        <View style={s.sectionAccent} />

        <View style={s.body}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {allIngredients.map((item, i) => (
              <View key={i} style={s.shopRow}>
                <View style={s.shopBox} />
                <Text style={s.shopText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerSite}>menugunlugu.com</Text>
          <Text style={s.footerInfo}>{dateStr}</Text>
        </View>
      </Page>

    </Document>
  );
}
