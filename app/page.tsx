import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getNewestRecipes, getTodayMenu, getBlogPosts } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import RecipeSlider from "@/components/ui/RecipeSlider";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";
import type { MenuWithRecipes, Recipe } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", 1)
    .single();
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
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

function TodayMenuCard({ menu }: { menu: MenuWithRecipes }) {
  const slots = [
    { key: "soup",    recipe: menu.soup    as Recipe | null },
    { key: "main",    recipe: menu.main    as Recipe | null },
    { key: "side",    recipe: menu.side    as Recipe | null },
    { key: "dessert", recipe: menu.dessert as Recipe | null },
  ];

  const dateStr = new Date(menu.date + "T12:00:00").toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", weekday: "long",
  });

  return (
    <section className="bg-warm-50 py-6 sm:py-10">
      <div className={CONTAINER}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-warm-900">Günün Menüsü</h2>
            <p className="text-sm text-warm-500 capitalize">{dateStr}</p>
          </div>
          <Link href="/gunun-menusu"
            className="text-brand-600 hover:text-brand-700 font-medium text-sm whitespace-nowrap">
            Tüm menüyü gör →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slots.map(({ key, recipe }) => (
            <Link
              key={key}
              href={recipe ? `/tarifler/${recipe.slug}` : "/gunun-menusu"}
              className="group relative rounded-2xl overflow-hidden bg-warm-200 aspect-[3/4] block"
            >
              {recipe?.image_url ? (
                <Image
                  src={recipe.image_url}
                  alt={recipe.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width:640px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl text-warm-400">🍽️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <span className="block text-[10px] font-semibold text-brand-300 uppercase tracking-wide mb-0.5">
                  {CATEGORY_LABEL[key]}
                </span>
                <span className="block text-xs sm:text-sm font-bold text-white leading-tight line-clamp-2">
                  {recipe?.title ?? "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoMenuCard() {
  return (
    <section className="bg-warm-50 py-6 sm:py-10">
      <div className={CONTAINER}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-warm-900">Günün Menüsü</h2>
          <Link href="/gunun-menusu" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
            Arşive git →
          </Link>
        </div>
        <Link href="/gunun-menusu"
          className="flex items-center gap-4 bg-white border border-warm-200 rounded-2xl px-6 py-5 hover:border-brand-300 transition-colors">
          <span className="text-4xl">🍽️</span>
          <div>
            <p className="font-semibold text-warm-900">Bugünün menüsü henüz yayınlanmadı</p>
            <p className="text-sm text-warm-500">Geçmiş günlerin menülerini görüntülemek için tıklayın</p>
          </div>
          <span className="ml-auto text-warm-400 text-lg">→</span>
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
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", "home")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: "__admin__" };

  const memberIds = [...new Set(newest.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const profileMap: Record<string, { name: string; avatar: string; username: string }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach((p) => { profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username }; });
  }

  let followsAdmin = false;
  const followMap: Record<string, boolean> = {};
  if (currentUserId && newest.length > 0) {
    const [adminFollowRes, memberFollowRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminFollowRes.data;
    (memberFollowRes.data ?? []).forEach((r: { following_id: string }) => { followMap[r.following_id] = true; });
  }

  const recentPosts = blogPosts.slice(0, 3);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-brand-600 to-warm-700 text-white">
        <div className={`${CONTAINER} py-6 sm:py-10 text-center`}>
          <h1 className="text-xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
            Her Gün Yeni Bir Menü,
            <br />
            <span className="text-brand-200">Her Gün Yeni Lezzetler</span>
          </h1>
          <p className="text-xs sm:text-lg text-brand-100 mb-4 sm:mb-7 max-w-xl mx-auto leading-relaxed">
            Günlük menüler, lezzetli tarifler ve sonsuz ilham.
          </p>

          {/* Mobile: 2×2 grid */}
          <div className="grid sm:hidden grid-cols-2 gap-2.5 max-w-xs mx-auto">
            <Link href="/gunun-menusu" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              🍽️ Bugünün Menüsü
            </Link>
            <Link href="/dunun-menusu" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              📅 Dünün Menüsü
            </Link>
            <Link href="/tarifler" className="col-span-2 inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              🥘 Tariflere Göz At
            </Link>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex flex-row gap-3 justify-center">
            <Link href="/gunun-menusu" className="inline-flex items-center justify-center gap-2 w-[180px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              🍽️ Bugünün Menüsü
            </Link>
            <Link href="/dunun-menusu" className="inline-flex items-center justify-center gap-2 w-[180px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              📅 Dünün Menüsü
            </Link>
            <Link href="/tarifler" className="inline-flex items-center justify-center gap-2 w-[180px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              🥘 Tariflere Göz At
            </Link>
          </div>
        </div>
      </section>

      {/* ── Günün Menüsü Kartı ── */}
      {todayMenu ? <TodayMenuCard menu={todayMenu} /> : <NoMenuCard />}

      {/* ── Banner reklam ── */}
      <section className="bg-warm-100 pt-5 sm:pt-8 pb-0">
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
            <h2 className="text-xl sm:text-2xl font-bold text-warm-900">Yeni Eklenen Tarifler</h2>
            <Link href="/tarifler" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
              Tümünü gör →
            </Link>
          </div>
          {newest.length === 0 ? (
            <div className="text-center py-10 text-warm-400">
              <p className="text-4xl mb-3">🍳</p>
              <p>Henüz tarif eklenmemiş.</p>
            </div>
          ) : (
            <RecipeSlider
              recipes={newest}
              adminAuthor={adminAuthor}
              profileMap={profileMap}
              isLoggedIn={!!currentUserId}
              followMap={followMap}
              followsAdmin={followsAdmin}
              sponsoredAd={homeAd ?? undefined}
            />
          )}
        </div>
      </section>

      {/* ── Blog Yazıları ── */}
      {recentPosts.length > 0 && (
        <section className="bg-warm-50 py-6 sm:py-10">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-warm-900">Blog Yazıları</h2>
              <Link href="/blog" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
                Tümünü gör →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-warm-200 hover:border-brand-300 hover:shadow-md transition-all">
                  {post.image_url && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 100vw, 33vw"
                      />
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
