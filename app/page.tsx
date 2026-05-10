import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getNewestRecipes, getTodayMenu, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";
import HeroSlider, { type HeroSlide } from "@/components/ui/HeroSlider";
import type { Recipe } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("site_settings").select("logo_url").eq("id", 1).single();
  const logoUrl = data?.logo_url ?? null;
  return {
    alternates: { canonical: "/" },
    openGraph: {
      url: "https://www.menugunlugu.com/",
      siteName: "Menü Günlüğü",
      locale: "tr_TR",
      type: "website",
      title: "Menü Günlüğü",
      description: "Günlük menüler, tarifler ve daha fazlası.",
      ...(logoUrl && { images: [{ url: logoUrl, width: 1200, height: 1200 }] }),
    },
  };
}

export const dynamic = "force-dynamic";

const CONTAINER = "max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";

const CATEGORY_LABEL: Record<string, string> = {
  // İngilizce DB değerleri
  soup:        "Çorba",
  main:        "Ana Yemek",
  side:        "Yardımcı",
  dessert:     "Tatlı",
  salad:       "Salata",
  breakfast:   "Kahvaltı",
  snack:       "Atıştırmalık",
  drink:       "İçecek",
  appetizer:   "Meze",
  // Türkçe slug değerleri (alternatif)
  corba:       "Çorba",
  "ana-yemek": "Ana Yemek",
  tatli:       "Tatlı",
  salata:      "Salata",
  kahvalti:    "Kahvaltı",
  atistirmalik:"Atıştırmalık",
  icecek:      "İçecek",
  meze:        "Meze",
};

function categoryLabel(cat?: string | null) {
  if (!cat) return null;
  return CATEGORY_LABEL[cat] ?? cat.replace(/-/g, " ");
}

export default async function HomePage() {
  const supabase  = await createClient();
  const adminSb   = createAdminClient();

  const [newest, todayMenu, blogPosts, siteSettingsRes, heroSlidesRes] = await Promise.all([
    getNewestRecipes(12),
    getTodayMenu(),
    getBlogPosts(),
    adminSb.from("site_settings").select("adsense_enabled").eq("id", 1).single(),
    adminSb.from("hero_slides").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const adsEnabled = siteSettingsRes.data?.adsense_enabled !== false;

  const recentPosts  = blogPosts.slice(0, 4);
  const featuredPost = recentPosts[0] ?? null;
  const sidePosts    = recentPosts.slice(1);

  // ── Hero slides ──────────────────────────────────────────────
  const menuBgRecipe = todayMenu
    ? ([todayMenu.soup, todayMenu.main, todayMenu.side, todayMenu.dessert] as (Recipe | null)[])
        .find(r => r?.image_url) ?? null
    : null;

  const newestRecipe = newest[0] ?? null;
  const latestPost   = blogPosts[0] ?? null;
  const dbSlides     = heroSlidesRes.data ?? [];

  const slides: HeroSlide[] = dbSlides.length > 0
    ? dbSlides.flatMap(s => {
        let imageUrl: string | null = s.image_url ?? null;
        let title: string = (s.title ?? "").replace(/\\n/g, "\n");
        let ctaHref: string = s.cta_href ?? "";

        if (s.slide_key === "gunun-menusu" && !s.image_url)
          imageUrl = menuBgRecipe?.image_url ?? null;
        if (s.slide_key === "son-tarif" && newestRecipe) {
          if (!s.image_url) imageUrl = newestRecipe.image_url ?? null;
          if (!s.title)    title    = newestRecipe.title;
          if (!s.cta_href) ctaHref  = `/tarifler/${newestRecipe.slug}`;
        }
        if (s.slide_key === "menu-onerileri" && !s.image_url)
          imageUrl = newest[2]?.image_url ?? newest[1]?.image_url ?? null;
        if (s.slide_key === "blog" && latestPost) {
          if (!s.image_url) imageUrl = latestPost.image_url ?? null;
          if (!s.title)    title    = latestPost.title;
          if (!s.cta_href) ctaHref  = `/blog/${latestPost.slug}`;
        }
        if (s.slide_key === "oyna" && !s.image_url)
          imageUrl = newest[4]?.image_url ?? newest[3]?.image_url ?? null;

        if (!title || !ctaHref) return [];
        return [{ id: s.slide_key ?? `slide-${s.id}`, imageUrl, tint: s.tint ?? undefined, badge: s.badge, title, subtitle: s.subtitle ?? undefined, ctaLabel: s.cta_label, ctaHref, gradient: s.gradient } satisfies HeroSlide];
      })
    : [
        { id: "gunun-menusu", imageUrl: menuBgRecipe?.image_url ?? null, badge: "Her Gün Yeni Bir Menü", title: "Her Gün Yeni Bir Menü,\nHer Gün Yeni Lezzetler", subtitle: "Bugünün menüsünü keşfet, ilham al.", ctaLabel: "Günün Menüsünü Gör", ctaHref: "/gunun-menusu", gradient: "from-brand-700 to-warm-800" },
        ...(newestRecipe ? [{ id: "son-tarif", imageUrl: newestRecipe.image_url ?? null, badge: "Yeni Tarif", title: newestRecipe.title, subtitle: "Taze bir tarif seni bekliyor.", ctaLabel: "Tarife Git", ctaHref: `/tarifler/${newestRecipe.slug}`, gradient: "from-warm-800 to-warm-600" }] : []),
        { id: "menu-onerileri", imageUrl: newest[2]?.image_url ?? newest[1]?.image_url ?? null, tint: "bg-[#7C4A1E]/35", badge: "Topluluk", title: "Menü Önerileri", subtitle: "Editör seçkisi ve kullanıcı paylaşımlarından ilham al.", ctaLabel: "Keşfet", ctaHref: "/menu-gunlugu", gradient: "from-[#7C4A1E] to-[#C87941]" },
        ...(latestPost ? [{ id: "blog", imageUrl: latestPost.image_url ?? null, badge: "Yeni Blog", title: latestPost.title, subtitle: latestPost.excerpt ?? "Mutfak rehberleri ve lezzet yazıları.", ctaLabel: "Yazıyı Oku", ctaHref: `/blog/${latestPost.slug}`, gradient: "from-[#2C4A3E] to-[#4A7C6A]" }] : []),
        { id: "oyna", imageUrl: newest[4]?.image_url ?? newest[3]?.image_url ?? null, tint: "bg-[#3D1F5C]/40", badge: "Eğlence", title: "Oyna & Keşfet", subtitle: "Yemek dünyasına özel mini oyunlar ve quizler.", ctaLabel: "Oyunlara Git", ctaHref: "/oyna", gradient: "from-[#3D1F5C] to-[#7B3FA0]" },
      ];

  return (
    <div>
      {/* ── Hero Slider ── */}
      <HeroSlider slides={slides} />

      {/* ── Banner reklam ── */}
      <section className="bg-warm-100 pt-0 pb-0">
        <div className={CONTAINER}>
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[80px]" adWidth="320px" adHeight="80px" className="block sm:hidden mx-auto" />
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[160px]" adWidth="728px" adHeight="160px" className="hidden sm:block mx-auto" />
        </div>
      </section>

      {/* ── Son Tarifler ── */}
      <section className="bg-warm-100 py-6 sm:py-10">
        <div className={CONTAINER}>
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-2xl font-bold text-warm-900">Öne Çıkan Tarifler</h2>
            <Link href="/tarifler" className="text-brand-600 hover:text-brand-700 font-medium text-xs sm:text-sm flex-shrink-0">
              Tümünü gör →
            </Link>
          </div>

          {newest.length === 0 ? (
            <p className="text-center py-10 text-warm-400 text-sm">Henüz tarif eklenmemiş.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {newest.slice(0, 8).map(recipe => (
                <Link key={recipe.id} href={`/tarifler/${recipe.slug}`} className="group">
                  {/* Image */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-2.5">
                    {recipe.image_url ? (
                      <Image
                        src={recipe.image_url}
                        alt={recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-warm-200 flex items-center justify-center text-3xl">🍽️</div>
                    )}
                    {/* Category badge */}
                    {recipe.category && (
                      <span className="absolute bottom-2 left-2 bg-brand-500/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {categoryLabel(recipe.category)}
                      </span>
                    )}
                  </div>
                  {/* Title */}
                  <h3 className="font-semibold text-warm-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors px-0.5">
                    {recipe.title}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Blog Yazıları ── */}
      {recentPosts.length > 0 && (
        <section className="bg-warm-50 py-6 sm:py-10">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-2xl font-bold text-warm-900">Öne Çıkan Blog Yazıları</h2>
              <Link href="/blog" className="text-brand-600 hover:text-brand-700 font-medium text-xs sm:text-sm flex-shrink-0">
                Tümünü gör →
              </Link>
            </div>

            {/* Desktop: featured (2/3) + side stack (1/3) */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4">
              {/* Featured */}
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`}
                  className="sm:col-span-2 group relative rounded-3xl overflow-hidden block">
                  <div className="relative aspect-[16/9]">
                    {featuredPost.image_url ? (
                      <Image src={featuredPost.image_url} alt={featuredPost.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="66vw" />
                    ) : (
                      <div className="w-full h-full bg-warm-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {featuredPost.category && (
                        <span className="inline-block bg-brand-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-2">
                          {(featuredPost.category as { name: string }).name}
                        </span>
                      )}
                      <h3 className="text-white font-bold text-lg sm:text-xl leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors">
                        {featuredPost.title}
                      </h3>
                      {featuredPost.excerpt && (
                        <p className="text-white/70 text-sm mt-1.5 line-clamp-2">{featuredPost.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Side stack */}
              <div className="flex flex-col gap-3">
                {sidePosts.map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="group flex gap-3 bg-white rounded-2xl p-3 border border-warm-100 hover:border-brand-200 hover:shadow-sm transition-all">
                    {post.image_url && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={post.image_url} alt={post.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {post.category && (
                        <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-0.5">
                          {(post.category as { name: string }).name}
                        </span>
                      )}
                      <h3 className="font-semibold text-warm-900 text-sm leading-snug line-clamp-3 group-hover:text-brand-600 transition-colors">
                        {post.title}
                      </h3>
                    </div>
                  </Link>
                ))}
                {/* Blog'a git butonu */}
                <Link href="/blog"
                  className="flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-medium py-2 rounded-2xl border border-brand-100 hover:bg-brand-50 transition-colors mt-auto">
                  Tüm yazılar →
                </Link>
              </div>
            </div>

            {/* Mobil: featured kart + compact liste */}
            <div className="sm:hidden space-y-3">
              {/* Featured - görsel + overlay text */}
              {featuredPost && (
                <Link href={`/blog/${featuredPost.slug}`}
                  className="group relative rounded-2xl overflow-hidden block">
                  <div className="relative aspect-[16/9]">
                    {featuredPost.image_url ? (
                      <Image src={featuredPost.image_url} alt={featuredPost.title} fill
                        className="object-cover" sizes="100vw" />
                    ) : (
                      <div className="w-full h-full bg-warm-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                      {featuredPost.category && (
                        <span className="inline-block bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-1.5">
                          {(featuredPost.category as { name: string }).name}
                        </span>
                      )}
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-2">
                        {featuredPost.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              )}

              {/* Side posts - compact horizontal */}
              {sidePosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-warm-100">
                  {post.image_url && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={post.image_url} alt={post.title} fill className="object-cover" sizes="64px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {post.category && (
                      <span className="text-[9px] font-semibold text-brand-500 uppercase tracking-wide">
                        {(post.category as { name: string }).name}
                      </span>
                    )}
                    <p className="font-semibold text-warm-900 text-sm leading-snug line-clamp-2 mt-0.5">{post.title}</p>
                  </div>
                  <span className="text-warm-400 flex-shrink-0 text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Menü Önerileri CTA ── */}
      <section className="bg-warm-100 py-6 sm:py-10">
        <div className={CONTAINER}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5C3317] to-[#C87941] px-6 py-8 sm:px-10 sm:py-10">

            {/* Dekoratif tarif görselleri — sadece desktop */}
            <div className="absolute right-0 top-0 bottom-0 hidden sm:flex items-center gap-2 pr-4 pointer-events-none select-none">
              {newest.filter(r => r.image_url).slice(5, 9).map((r, i) => (
                <div key={r.id}
                  className="relative rounded-2xl overflow-hidden flex-shrink-0 opacity-40"
                  style={{ width: 90, height: 120 + i * 16, marginTop: i % 2 === 0 ? 0 : 24 }}>
                  <Image src={r.image_url!} alt="" fill className="object-cover" sizes="90px" />
                </div>
              ))}
            </div>

            <div className="relative z-10 max-w-md">
              <span className="inline-block bg-white/20 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                Topluluk
              </span>
              <h2 className="text-white font-extrabold text-xl sm:text-3xl leading-tight mb-2">
                Menü Önerileri
              </h2>
              <p className="text-white/75 text-sm sm:text-base mb-5 leading-relaxed">
                Editör seçkisi ve kullanıcı paylaşımlarından ilham al. Yeni tarifler ve menü fikirleri seni bekliyor.
              </p>
              <Link href="/menu-gunlugu"
                className="inline-flex items-center gap-2 bg-white text-[#7C4A1E] font-bold px-5 sm:px-6 py-2.5 rounded-full text-sm hover:bg-warm-50 transition-colors shadow-sm">
                Keşfet →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PagePopup page="home" />
    </div>
  );
}
