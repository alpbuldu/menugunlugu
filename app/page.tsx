import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getNewestRecipes, getTodayMenu, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import RecipeSlider from "@/components/ui/RecipeSlider";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";
import HeroSlider, { type HeroSlide } from "@/components/ui/HeroSlider";
import type { MenuWithRecipes, Recipe } from "@/lib/types";

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

const MEAL_EMOJI: Record<string, string> = {
  soup: "🥣", main: "🍖", side: "🥗", dessert: "🍮",
};
const CATEGORY_LABEL: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

/* ── Günün Menüsü: tek büyük teaser kartı ── */
function TodayMenuCard({ menu }: { menu: MenuWithRecipes }) {
  const slots = [
    { key: "soup",    recipe: menu.soup    as Recipe | null },
    { key: "main",    recipe: menu.main    as Recipe | null },
    { key: "side",    recipe: menu.side    as Recipe | null },
    { key: "dessert", recipe: menu.dessert as Recipe | null },
  ];

  // Ana yemek görseli arka plan için, yoksa ilk görselli tarif
  const bgRecipe = slots.find(s => s.recipe?.image_url)?.recipe ?? null;

  const dateStr = new Date(menu.date + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", weekday: "long",
  });

  return (
    <section className="bg-warm-100 py-5 sm:py-8">
      <div className={CONTAINER}>
        <Link href="/gunun-menusu" className="group block relative rounded-2xl sm:rounded-3xl overflow-hidden h-48 sm:h-72">
          {/* Arka plan fotoğrafı */}
          {bgRecipe?.image_url ? (
            <Image
              src={bgRecipe.image_url}
              alt="Günün Menüsü"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width:640px) 100vw, 1100px"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
          )}

          {/* Gradient overlay — alttan koyulaşan */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          {/* Sol üst: etiket + tarih */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
            <span className="inline-block bg-brand-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-1.5">
              Günün Menüsü
            </span>
            <p className="text-white/75 text-xs sm:text-sm capitalize">{dateStr}</p>
          </div>

          {/* Sağ üst: git okı */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-6 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/35 transition-colors">
            <span className="text-white text-sm">→</span>
          </div>

          {/* Alt: 4 yemek listesi */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 sm:pb-5">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {slots.map(({ key, recipe }) => (
                <span key={key} className="flex items-center gap-1.5 text-white text-xs sm:text-sm">
                  <span className="text-base leading-none">{MEAL_EMOJI[key]}</span>
                  <span className="font-medium leading-snug">{recipe?.title ?? "—"}</span>
                </span>
              ))}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

function NoMenuCard() {
  return (
    <section className="bg-warm-100 py-5 sm:py-8">
      <div className={CONTAINER}>
        <Link href="/gunun-menusu"
          className="flex items-center gap-4 bg-white border border-warm-200 rounded-2xl px-5 py-4 hover:border-brand-300 transition-colors">
          <span className="text-3xl">🍽️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-warm-900 text-sm">Bugünün menüsü henüz yayınlanmadı</p>
            <p className="text-xs text-warm-500">Geçmiş günlerin menülerini keşfet</p>
          </div>
          <span className="text-warm-400 flex-shrink-0">→</span>
        </Link>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const adminSb = createAdminClient();

  const [newest, todayMenu, blogPosts, siteSettingsRes] = await Promise.all([
    getNewestRecipes(12),
    getTodayMenu(),
    getBlogPosts(),
    adminSb.from("site_settings").select("adsense_enabled").eq("id", 1).single(),
  ]);

  const adsEnabled = siteSettingsRes.data?.adsense_enabled !== false;

  const { data: homeAd } = adsEnabled ? await adminSb
    .from("ads").select("image_url, link_url, title")
    .eq("placement", "home").eq("is_active", true)
    .order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };

  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: "__admin__" };

  const memberIds = [...new Set(newest.filter(r => r.submitted_by).map(r => r.submitted_by as string))];
  const profileMap: Record<string, { name: string; avatar: string; username: string }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach(p => { profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username }; });
  }

  let followsAdmin = false;
  const followMap: Record<string, boolean> = {};
  if (currentUserId && newest.length > 0) {
    const [adminRes, memberRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminRes.data;
    (memberRes.data ?? []).forEach((r: { following_id: string }) => { followMap[r.following_id] = true; });
  }

  const recentPosts = blogPosts.slice(0, 3);

  // ── Hero slides ──────────────────────────────────────────────
  const menuBgRecipe = todayMenu
    ? ([todayMenu.soup, todayMenu.main, todayMenu.side, todayMenu.dessert] as (Recipe | null)[])
        .find(r => r?.image_url) ?? null
    : null;

  const newestRecipe = newest[0] ?? null;
  const latestPost   = blogPosts[0] ?? null;

  const slides: HeroSlide[] = [
    // 1 — Günün Menüsü
    {
      id: "gunun-menusu",
      imageUrl: menuBgRecipe?.image_url ?? null,
      badge: "Her Gün Yenileniyor",
      title: "Her Gün Yeni Bir Menü,\nHer Gün Yeni Lezzetler",
      subtitle: "Bugünün menüsünü keşfet, ilham al.",
      ctaLabel: "Günün Menüsünü Gör",
      ctaHref: "/gunun-menusu",
      gradient: "from-brand-700 to-warm-800",
    },
    // 2 — Son tarif
    ...(newestRecipe ? [{
      id: "son-tarif",
      imageUrl: newestRecipe.image_url ?? null,
      badge: "Yeni Eklendi",
      title: newestRecipe.title,
      subtitle: "Taze bir tarif seni bekliyor.",
      ctaLabel: "Tarife Git",
      ctaHref: `/tarifler/${newestRecipe.slug}`,
      gradient: "from-warm-800 to-warm-600",
    }] : []),
    // 3 — Menü Önerileri
    {
      id: "menu-onerileri",
      imageUrl: null,
      badge: "Topluluk",
      title: "Menü Önerileri",
      subtitle: "Editör seçkisi ve kullanıcı paylaşımlarından ilham al.",
      ctaLabel: "Keşfet",
      ctaHref: "/menu-gunlugu",
      gradient: "from-[#7C4A1E] to-[#C87941]",
    },
    // 4 — Blog
    ...(latestPost ? [{
      id: "blog",
      imageUrl: latestPost.image_url ?? null,
      badge: "Blog",
      title: latestPost.title,
      subtitle: latestPost.excerpt ?? "Mutfak rehberleri ve lezzet yazıları.",
      ctaLabel: "Yazıyı Oku",
      ctaHref: `/blog/${latestPost.slug}`,
      gradient: "from-[#2C4A3E] to-[#4A7C6A]",
    }] : []),
    // 5 — Oyna
    {
      id: "oyna",
      imageUrl: null,
      badge: "Eğlence",
      title: "Oyna & Keşfet",
      subtitle: "Yemek dünyasına özel mini oyunlar ve quizler.",
      ctaLabel: "Oyunlara Git",
      ctaHref: "/oyna",
      gradient: "from-[#3D1F5C] to-[#7B3FA0]",
    },
  ];

  return (
    <div>
      {/* ── Hero Slider ── */}
      <HeroSlider slides={slides} />

      {/* ── Günün Menüsü teaser kartı ── */}
      {todayMenu ? <TodayMenuCard menu={todayMenu} /> : <NoMenuCard />}

      {/* ── Banner reklam ── */}
      <section className="bg-warm-100 pt-0 pb-0">
        <div className={CONTAINER}>
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[80px]" adWidth="320px" adHeight="80px" className="block sm:hidden mx-auto" />
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[160px]" adWidth="728px" adHeight="160px" className="hidden sm:block mx-auto" />
        </div>
      </section>

      {/* ── Yeni Eklenen Tarifler ── */}
      <section className="bg-warm-100 py-5 sm:py-8">
        <div className={CONTAINER}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-warm-900">Yeni Eklenen Tarifler</h2>
            <Link href="/tarifler" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
              Tümünü gör →
            </Link>
          </div>
          {newest.length > 0 ? (
            <RecipeSlider
              recipes={newest}
              adminAuthor={adminAuthor}
              profileMap={profileMap}
              isLoggedIn={!!currentUserId}
              followMap={followMap}
              followsAdmin={followsAdmin}
              sponsoredAd={homeAd ?? undefined}
            />
          ) : (
            <p className="text-center py-10 text-warm-400">Henüz tarif eklenmemiş.</p>
          )}
        </div>
      </section>

      {/* ── Blog Yazıları ── */}
      {recentPosts.length > 0 && (
        <section className="bg-warm-50 py-5 sm:py-8">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-warm-900">Blog Yazıları</h2>
              <Link href="/blog" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
                Tümünü gör →
              </Link>
            </div>

            {/* Mobil: kompakt liste */}
            <div className="flex flex-col divide-y divide-warm-200 sm:hidden">
              {recentPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="flex items-center gap-3 py-3 hover:text-brand-600 transition-colors">
                  {post.image_url && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={post.image_url} alt={post.title} fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {post.category && (
                      <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide">
                        {(post.category as { name: string }).name}
                      </span>
                    )}
                    <p className="font-semibold text-warm-900 text-sm leading-snug line-clamp-2">{post.title}</p>
                  </div>
                  <span className="text-warm-400 flex-shrink-0 text-sm">→</span>
                </Link>
              ))}
            </div>

            {/* Desktop: 3 kart */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
              {recentPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-warm-200 hover:border-brand-300 hover:shadow-md transition-all">
                  {post.image_url && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image src={post.image_url} alt={post.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="33vw" />
                    </div>
                  )}
                  <div className="p-4">
                    {post.category && (
                      <span className="text-[11px] font-semibold text-brand-500 uppercase tracking-wide">
                        {(post.category as { name: string }).name}
                      </span>
                    )}
                    <h3 className="font-bold text-warm-900 mt-1 mb-1.5 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-warm-500 line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PagePopup page="home" />
    </div>
  );
}
