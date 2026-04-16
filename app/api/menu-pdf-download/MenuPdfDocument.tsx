import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/* ── Font registration (Latin + Turkish support) ─────────────── */
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

/* Disable automatic hyphenation */
Font.registerHyphenationCallback((word) => [word]);

/* ── Brand palette ───────────────────────────────────────────── */
const C = {
  brand:      "#d97706",
  brandDark:  "#92400e",
  brandDeep:  "#78350f",
  brandLight: "#fef3e2",
  brandMid:   "#fde68a",
  white:      "#ffffff",
  text:       "#1c1917",
  textMid:    "#44403c",
  muted:      "#78716c",
  line:       "#e7e5e4",
  veryLight:  "#f5f5f4",
};

/* ── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Roboto",
    fontSize: 10,
    color: C.text,
  },

  /* Cover ─────────────────────── */
  coverBand: {
    backgroundColor: C.brand,
    paddingTop: 52,
    paddingBottom: 52,
    paddingLeft: 44,
    paddingRight: 44,
  },
  coverSite: {
    fontSize: 8,
    color: C.brandLight,
    letterSpacing: 2.5,
    fontFamily: "Roboto",
    fontWeight: 700,
    marginBottom: 14,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 40,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  coverDate: {
    fontSize: 12,
    color: C.brandLight,
    fontFamily: "Roboto",
  },
  coverBody: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 44,
    paddingRight: 44,
    flex: 1,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.brandMid,
    borderStyle: "solid",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 14,
  },
  mealDot: {
    width: 4,
    height: 32,
    backgroundColor: C.brand,
    borderRadius: 2,
    marginRight: 18,
    flexShrink: 0,
  },
  mealLabel: {
    fontSize: 7.5,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  mealTitle: {
    fontSize: 15,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.text,
  },
  mealAuthor: {
    fontSize: 8,
    color: C.muted,
    fontFamily: "Roboto",
    marginTop: 2,
  },

  /* Section header (reused on non-cover pages) ── */
  sectionBand: {
    backgroundColor: C.brand,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 44,
    paddingRight: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 7.5,
    color: C.brandLight,
    fontFamily: "Roboto",
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.white,
  },
  sectionRight: {
    fontSize: 8,
    color: C.brandLight,
    fontFamily: "Roboto",
    textAlign: "right",
  },

  /* Body wrapper ──────────────── */
  body: {
    paddingTop: 28,
    paddingBottom: 60,
    paddingLeft: 44,
    paddingRight: 44,
  },

  /* Shopping list ─────────────── */
  shoppingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
    width: "50%",
    paddingRight: 18,
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1.2,
    borderColor: C.muted,
    borderStyle: "solid",
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  shoppingText: {
    fontSize: 9.5,
    color: C.textMid,
    fontFamily: "Roboto",
    flex: 1,
    lineHeight: 1.4,
  },

  /* Recipe ────────────────────── */
  recipeTitleRow: {
    marginBottom: 4,
  },
  recipeTitle: {
    fontSize: 22,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.text,
  },
  recipeMeta: {
    fontSize: 8.5,
    color: C.muted,
    fontFamily: "Roboto",
    marginTop: 3,
    marginBottom: 22,
  },
  recipeCols: {
    flexDirection: "row",
    gap: 28,
  },
  colLeft: {
    width: "36%",
  },
  colRight: {
    flex: 1,
  },
  colHeading: {
    fontSize: 7.5,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.brandMid,
    borderBottomStyle: "solid",
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  ingBullet: {
    width: 5,
    height: 5,
    backgroundColor: C.brand,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 3,
    flexShrink: 0,
  },
  ingText: {
    fontSize: 9.5,
    color: C.textMid,
    fontFamily: "Roboto",
    flex: 1,
    lineHeight: 1.4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  stepBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.brandLight,
    borderWidth: 1,
    borderColor: C.brandMid,
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNum: {
    fontSize: 7.5,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.brand,
  },
  stepText: {
    fontSize: 9.5,
    color: C.textMid,
    fontFamily: "Roboto",
    flex: 1,
    lineHeight: 1.55,
  },

  /* Footer ────────────────────── */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    borderTopStyle: "solid",
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7.5,
    color: C.muted,
    fontFamily: "Roboto",
  },
  footerBrand: {
    fontSize: 7.5,
    color: C.brand,
    fontFamily: "Roboto",
    fontWeight: 700,
  },
});

/* ── Types ───────────────────────────────────────────────────── */
export interface PdfRecipeData {
  id: string;
  title: string;
  category: string;
  ingredients: string[];
  instructions: string[];
  servings: number | null;
  author: string;
  authorUrl: string;
}

interface Props {
  recipes: {
    soup:    PdfRecipeData;
    main:    PdfRecipeData;
    side:    PdfRecipeData;
    dessert: PdfRecipeData;
  };
  allIngredients: string[];
  dateStr: string;
}

const SLOTS = [
  { key: "soup"    as const, label: "Çorba",           category: "ÇORBA" },
  { key: "main"    as const, label: "Ana Yemek",        category: "ANA YEMEK" },
  { key: "side"    as const, label: "Yardımcı Lezzet",  category: "YARDIMCI LEZZET" },
  { key: "dessert" as const, label: "Tatlı",            category: "TATLI" },
];

/* ── Document ────────────────────────────────────────────────── */
export function MenuPdfDocument({ recipes, allIngredients, dateStr }: Props) {
  return (
    <Document title="Günün Menüsü" author="Menü Günlüğü">

      {/* ══ SAYFA 1: KAPAK ══════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* Header band */}
        <View style={s.coverBand}>
          <Text style={s.coverSite}>menugunlugu.com</Text>
          <Text style={s.coverTitle}>Günün Menüsü</Text>
          <Text style={s.coverDate}>{dateStr}</Text>
        </View>

        {/* Accent bar */}
        <View style={{ height: 4, backgroundColor: C.brandDark }} />

        {/* Meal cards */}
        <View style={s.coverBody}>
          {SLOTS.map(({ key, label }) => {
            const r = recipes[key];
            return (
              <View key={key} style={s.mealCard}>
                <View style={s.mealDot} />
                <View>
                  <Text style={s.mealLabel}>{label}</Text>
                  <Text style={s.mealTitle}>{r.title}</Text>
                  {r.author && (
                    <Text style={s.mealAuthor}>Yazar: {r.author}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerBrand}>menugunlugu.com</Text>
          <Text style={s.footerText}>Günün Menüsü Kartı · {dateStr}</Text>
        </View>
      </Page>

      {/* ══ SAYFA 2: ALIŞVERİŞ LİSTESİ ════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.sectionBand}>
          <View>
            <Text style={s.sectionLabel}>Menü Günlüğü</Text>
            <Text style={s.sectionTitle}>Alışveriş Listesi</Text>
          </View>
          <Text style={s.sectionRight}>{dateStr}{"\n"}4 öğün · {allIngredients.length} malzeme</Text>
        </View>
        <View style={{ height: 4, backgroundColor: C.brandDark }} />

        <View style={s.body}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {allIngredients.map((item, i) => (
              <View key={i} style={s.shoppingRow}>
                <View style={s.checkBox} />
                <Text style={s.shoppingText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerBrand}>menugunlugu.com</Text>
          <Text style={s.footerText}>{dateStr}</Text>
        </View>
      </Page>

      {/* ══ SAYFALAR 3-6: TARİFLER ═════════════════════════════ */}
      {SLOTS.map(({ key, label, category }) => {
        const r = recipes[key];
        return (
          <Page key={key} size="A4" style={s.page}>
            {/* Section band */}
            <View style={s.sectionBand}>
              <View>
                <Text style={s.sectionLabel}>{category}</Text>
                <Text style={s.sectionTitle}>{r.title}</Text>
              </View>
              {r.servings ? (
                <Text style={s.sectionRight}>{r.servings} kişilik</Text>
              ) : null}
            </View>
            <View style={{ height: 4, backgroundColor: C.brandDark }} />

            <View style={s.body}>
              {/* Author */}
              {r.author && (
                <Text style={s.recipeMeta}>
                  Yazar: {r.author}
                  {r.authorUrl ? `  ·  ${r.authorUrl}` : ""}
                </Text>
              )}

              <View style={s.recipeCols}>
                {/* Ingredients */}
                <View style={s.colLeft}>
                  <Text style={s.colHeading}>Malzemeler</Text>
                  {r.ingredients.map((item, i) => (
                    <View key={i} style={s.ingRow}>
                      <View style={s.ingBullet} />
                      <Text style={s.ingText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Instructions */}
                <View style={s.colRight}>
                  <Text style={s.colHeading}>Yapılışı</Text>
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
              <Text style={s.footerBrand}>menugunlugu.com</Text>
              <Text style={s.footerText}>{label} · {dateStr}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
