import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import path from "path";

/* -- Font registration --------------------------------------------------- */
const FONTS = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Roboto",
  fonts: [
    { src: path.join(FONTS, "Roboto-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS, "Roboto-Medium.ttf"),  fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export function ensureFonts(_siteUrl: string) { /* fonts registered at module load */ }

/* -- Brand palette ------------------------------------------------------- */
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

/* -- Style helpers ------------------------------------------------------- */
const bold   = (extra?: object) => ({ fontFamily: "Roboto", fontWeight: 700, ...extra });
const reg    = (extra?: object) => ({ fontFamily: "Roboto", fontWeight: 400, ...extra });

/* -- Styles -------------------------------------------------------------- */
const s = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: "Roboto", fontWeight: 400, fontSize: 10, color: C.text },

  /* Cover */
  coverBand: { backgroundColor: C.brand, paddingTop: 48, paddingBottom: 48, paddingLeft: 44, paddingRight: 44 },
  coverSite: { ...bold(), fontSize: 8, color: C.brandLight, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12, textDecoration: "none" },
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

  /* Section band */
  sectionBand: {
    backgroundColor: C.brand, paddingTop: 18, paddingBottom: 18,
    paddingLeft: 44, paddingRight: 44,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
  },
  sectionLabel: { ...bold(), fontSize: 7, color: C.brandLight, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 },
  sectionTitle: { ...bold(), fontSize: 20, color: C.white },
  sectionRight: { ...reg(), fontSize: 8, color: C.brandLight, textAlign: "right" },
  sectionAccent: { height: 4, backgroundColor: C.brandDark },

  /* Hero image */
  heroImage: { width: "100%", height: 160, objectFit: "cover" },
  heroPlaceholder: { width: "100%", height: 80, backgroundColor: C.brandLight },

  /* Body */
  body: { paddingTop: 22, paddingBottom: 60, paddingLeft: 44, paddingRight: 44 },
  recipeMeta: { ...reg(), fontSize: 8.5, color: C.muted, marginBottom: 18 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 4 },
  authorLabel: { ...reg(), fontSize: 8.5, color: C.muted },
  authorLink: { ...bold(), fontSize: 8.5, color: C.brand, textDecoration: "underline" },

  /* Two columns */
  cols: { flexDirection: "row", gap: 24 },
  colLeft: { width: "37%" },
  colRight: { flex: 1 },
  colHeading: {
    ...bold(), fontSize: 7, color: C.brand, letterSpacing: 1.5, textTransform: "uppercase",
    marginBottom: 8, paddingBottom: 5,
    borderBottomWidth: 1, borderBottomColor: C.brandMid, borderBottomStyle: "solid",
  },

  /* Ingredients */
  ingRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  ingBullet: { width: 5, height: 5, backgroundColor: C.brand, borderRadius: 3, marginRight: 8, marginTop: 3, flexShrink: 0 },
  ingText: { ...reg(), fontSize: 9, color: C.textMid, flex: 1, lineHeight: 1.4 },
  ingSectionHeader: { ...bold(), fontSize: 8.5, color: C.brand, marginTop: 7, marginBottom: 3 },

  /* Steps */
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 9 },
  stepBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.brandLight, borderWidth: 1, borderColor: C.brandMid, borderStyle: "solid",
    alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 1, flexShrink: 0,
  },
  stepNum: { ...bold(), fontSize: 7, color: C.brand },
  stepText: { ...reg(), fontSize: 9, color: C.textMid, flex: 1, lineHeight: 1.5 },

  /* Footer */
  footer: {
    position: "absolute", bottom: 18, left: 44, right: 44,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 0.5, borderTopColor: C.line, borderTopStyle: "solid", paddingTop: 6,
  },
  footerSite: { ...bold(), fontSize: 7.5, color: C.brand, textDecoration: "none" },
  footerInfo: { ...reg(), fontSize: 7.5, color: C.muted },
});

/* -- Types --------------------------------------------------------------- */
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
  dateStr: string;
}

const SLOTS = [
  { key: "soup"    as const, label: "Corba",           cat: "CORBA" },
  { key: "main"    as const, label: "Ana Yemek",        cat: "ANA YEMEK" },
  { key: "side"    as const, label: "Yardimci Lezzet",  cat: "YARDIMCI LEZZET" },
  { key: "dessert" as const, label: "Tatli",            cat: "TATLI" },
];

/* -- Helpers ------------------------------------------------------------- */
// ":" ilk 20 karakterde mi? -> bolum basligi
function ingColonIdx(item: string): number {
  const i = item.indexOf(":");
  return i > 1 && i <= 20 ? i : -1;
}

const STEPS_PER_PAGE = 12;

/* -- Document ------------------------------------------------------------ */
export function MenuPdfDocument({ recipes, dateStr }: Props) {
  return (
    <Document title="Gunun Menusu" author="Menu Gunlugu" language="tr">

      {/* SAYFA 1 - KAPAK */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBand}>
          <Link src="https://menugunlugu.com" style={s.coverSite}>menugunlugu.com</Link>
          <Text style={s.coverTitle}>{"Günün Menüsü"}</Text>
          <Text style={s.coverDate}>{dateStr}</Text>
        </View>
        <View style={s.coverAccent} />

        <View style={s.coverBody}>
          {SLOTS.map(({ key, label }) => {
            const r = recipes[key];
            return (
              <View key={key} style={s.mealCard}>
                {r.image_url ? (
                  <Image src={r.image_url} style={s.mealThumb} />
                ) : (
                  <View style={s.mealThumbPlaceholder} />
                )}
                <View style={s.mealAccent} />
                <View style={s.mealInfo}>
                  <Text style={s.mealLabel}>{label}</Text>
                  <Text style={s.mealTitle}>{r.title}</Text>
                  {r.author ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Text style={s.mealAuthor}>Yazar:</Text>
                      {r.authorUrl ? (
                        <Link src={`https://${r.authorUrl}`} style={{ ...s.mealAuthor, color: C.brand, textDecoration: "underline" }}>
                          {r.author}
                        </Link>
                      ) : (
                        <Text style={s.mealAuthor}>{r.author}</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.footer}>
          <Text style={s.footerSite}>menugunlugu.com</Text>
          <Text style={s.footerInfo}>{"Günün Menüsü · "}{dateStr}</Text>
        </View>
      </Page>

      {/* SAYFALAR 2+ - TARIFLER (12 adim/sayfa kurali) */}
      {SLOTS.map(({ key, label, cat }) => {
        const r = recipes[key];

        // Adimlari 12'lik gruplara bol
        const stepChunks: string[][] = [];
        for (let i = 0; i < r.instructions.length; i += STEPS_PER_PAGE) {
          stepChunks.push(r.instructions.slice(i, i + STEPS_PER_PAGE));
        }
        if (stepChunks.length === 0) stepChunks.push([]);

        // Malzeme satirini render et (bolum basligi kontroluyle)
        const renderIngredient = (item: string, idx: number) => {
          // "Hamuru icin:" - sadece baslik
          if (item.endsWith(":")) {
            return <Text key={idx} style={s.ingSectionHeader}>{item}</Text>;
          }
          // "Servisi icin:Lavas tortilla ekmegi" - baslik + malzeme
          const ci = ingColonIdx(item);
          if (ci !== -1) {
            const header = item.slice(0, ci + 1);
            const rest   = item.slice(ci + 1).trim();
            return (
              <View key={idx}>
                <Text style={s.ingSectionHeader}>{header}</Text>
                {rest ? (
                  <View style={s.ingRow}>
                    <View style={s.ingBullet} />
                    <Text style={s.ingText}>{rest}</Text>
                  </View>
                ) : null}
              </View>
            );
          }
          // Normal malzeme
          return (
            <View key={idx} style={s.ingRow}>
              <View style={s.ingBullet} />
              <Text style={s.ingText}>{item}</Text>
            </View>
          );
        };

        return stepChunks.map((chunk, pageIdx) => {
          const isFirst     = pageIdx === 0;
          const globalStart = pageIdx * STEPS_PER_PAGE;

          return (
            <Page key={`${key}-${pageIdx}`} size="A4" style={s.page}>
              {/* Section band */}
              <View style={s.sectionBand}>
                <View>
                  <Text style={s.sectionLabel}>{cat}{!isFirst ? " - DEVAM" : ""}</Text>
                  <Text style={s.sectionTitle}>{r.title}</Text>
                </View>
                {r.servings ? <Text style={s.sectionRight}>{r.servings} kisilik</Text> : null}
              </View>
              <View style={s.sectionAccent} />

              {/* Hero image - sadece ilk sayfada */}
              {isFirst ? (
                r.image_url ? (
                  <Image src={r.image_url} style={s.heroImage} />
                ) : (
                  <View style={s.heroPlaceholder} />
                )
              ) : null}

              <View style={s.body}>
                {/* Yazar - sadece ilk sayfada */}
                {isFirst && r.author ? (
                  <View style={s.authorRow}>
                    <Text style={s.authorLabel}>Yazar:</Text>
                    {r.authorUrl ? (
                      <Link src={`https://${r.authorUrl}`} style={s.authorLink}>
                        {r.author}
                      </Link>
                    ) : (
                      <Text style={s.authorLabel}>{r.author}</Text>
                    )}
                  </View>
                ) : null}

                <View style={s.cols}>
                  {/* Malzemeler - sadece ilk sayfada */}
                  {isFirst ? (
                    <View style={s.colLeft}>
                      <Text style={s.colHeading}>Malzemeler</Text>
                      {r.ingredients.map((item, i) => renderIngredient(item, i))}
                    </View>
                  ) : (
                    <View style={s.colLeft} />
                  )}

                  {/* Yapilisi */}
                  <View style={s.colRight}>
                    <Text style={s.colHeading}>
                      {isFirst
                        ? "Yapilisi"
                        : `Yapilisi - ${globalStart + 1}. adimdan devam`}
                    </Text>
                    {chunk.map((step, i) => (
                      <View key={i} style={s.stepRow}>
                        <View style={s.stepBadge}>
                          <Text style={s.stepNum}>{globalStart + i + 1}</Text>
                        </View>
                        <Text style={s.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={s.footer}>
                <Link src="https://menugunlugu.com" style={s.footerSite}>menugunlugu.com</Link>
                <Text style={s.footerInfo}>
                  {label}{!isFirst ? " - devam" : ""}{" - "}{dateStr}
                </Text>
              </View>
            </Page>
          );
        });
      })}

    </Document>
  );
}
