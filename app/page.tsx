import type { Metadata } from "next";
import Link from "next/link";
import { getRandomRecipes } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import RecipeSlider from "@/components/ui/RecipeSlider";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";

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

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const featured = await getRandomRecipes();

  const adminSb = createAdminClient();

  // Global reklam toggle
  const { data: siteSettings } = await adminSb
    .from("site_settings")
    .select("adsense_enabled")
    .eq("id", 1)
    .single();
  // Kolon yoksa (undefined) → açık sayılır; sadece açıkça false ise kapalı
  const adsEnabled = siteSettings?.adsense_enabled !== false;

  // Ana sayfa sponsorlu kart (slider ortası)
  const { data: homeAd } = adsEnabled ? await adminSb
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", "home")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  // Admin profili
  const { data: ap } = await supabase.from("admin_profile").select("username, avatar_url").eq("id", 1).single();
  const adminAuthor = { name: ap?.username ?? "Menü Günlüğü", avatar: ap?.avatar_url ?? "", username: "__admin__" };

  // Üye profilleri (submitted_by olan tarifler için)
  const memberIds = [...new Set(featured.filter((r) => r.submitted_by).map((r) => r.submitted_by as string))];
  const profileMap: Record<string, { name: string; avatar: string; username: string }> = {};
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", memberIds);
    profiles?.forEach((p) => { profileMap[p.id] = { name: p.username, avatar: p.avatar_url ?? "", username: p.username }; });
  }

  // Follow durumu
  let followsAdmin = false;
  const followMap: Record<string, boolean> = {};
  if (currentUserId && featured.length > 0) {
    const [adminFollowRes, memberFollowRes] = await Promise.all([
      supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUserId).maybeSingle(),
      memberIds.length
        ? supabase.from("follows").select("following_id").eq("follower_id", currentUserId).in("following_id", memberIds)
        : Promise.resolve({ data: [] }),
    ]);
    followsAdmin = !!adminFollowRes.data;
    (memberFollowRes.data ?? []).forEach((r: { following_id: string }) => { followMap[r.following_id] = true; });
  }

  return (
    <div>
{/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-600 to-warm-700 text-white">
        <div className={`${CONTAINER} py-6 sm:py-10 text-center`}>
          <h1 className="text-xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 leading-tight">
            Her Gün Yeni Bir Menü,
            <br />
            <span className="text-brand-200">Her Gün Yeni Lezzetler</span>
          </h1>
          <p className="text-xs sm:text-lg text-brand-100 mb-4 sm:mb-7 max-w-xl mx-auto leading-relaxed">
            Günlük menüler, lezzetli tarifler ve sonsuz ilham.
            <br />
            Bugünün menüsünü keşfet!
          </p>
          {/* Mobile: 2×2 grid */}
          <div className="grid sm:hidden grid-cols-2 gap-2.5 max-w-xs mx-auto">
            <Link href="/gunun-menusu" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              🍽️ Bugünün Menüsü
            </Link>
            <Link href="/dunun-menusu" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              📅 Dünün Menüsü
            </Link>
            <Link href="/tarifler" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              🥘 Tariflere Göz At
            </Link>
            <Link href="/menu-olustur" className="inline-flex items-center justify-center gap-1.5 py-2.5 bg-white text-brand-700 rounded-lg font-medium text-sm hover:bg-brand-50 transition-colors">
              ✨ Menü Oluştur
            </Link>
          </div>
          {/* Desktop: all 4 in a single row */}
          <div className="hidden sm:flex flex-row gap-3 justify-center">
            <Link href="/gunun-menusu" className="inline-flex items-center justify-center gap-2 w-[200px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              🍽️ Bugünün Menüsü
            </Link>
            <Link href="/dunun-menusu" className="inline-flex items-center justify-center gap-2 w-[200px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              📅 Dünün Menüsü
            </Link>
            <Link href="/tarifler" className="inline-flex items-center justify-center gap-2 w-[200px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              🥘 Tariflere Göz At
            </Link>
            <Link href="/menu-olustur" className="inline-flex items-center justify-center gap-2 w-[200px] py-3 bg-white text-brand-700 rounded-xl font-medium text-base hover:bg-brand-50 transition-colors">
              ✨ Menü Oluştur
            </Link>
          </div>
        </div>
      </section>

      {/* ── Banner — custom aktifse onu, değilse AdSense */}
      <section className="bg-warm-100 pt-5 sm:pt-8 pb-0">
        <div className={CONTAINER}>
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[80px]" adWidth="320px" adHeight="80px" className="block sm:hidden mx-auto" />
          <AdSlot placement="home_banner" adSenseSlot="anasayfa_banner"
            imageHeight="h-[160px]" adWidth="728px" adHeight="160px" className="hidden sm:block mx-auto" />
        </div>
      </section>

      {/* ── Featured Recipes ──────────────────────────────────── */}
      <section className="bg-warm-100 py-5 sm:py-8">
        <div className={CONTAINER}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-warm-900">Öne Çıkan Tarifler</h2>
            <Link href="/tarifler" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
              Tümünü gör →
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-10 text-warm-400">
              <p className="text-4xl mb-3">🍳</p>
              <p>Henüz tarif eklenmemiş.</p>
            </div>
          ) : (
            <>
              <RecipeSlider
                recipes={featured}
                adminAuthor={adminAuthor}
                profileMap={profileMap}
                isLoggedIn={!!currentUserId}
                followMap={followMap}
                followsAdmin={followsAdmin}
                sponsoredAd={homeAd ?? undefined}
              />
            </>
          )}
        </div>
      </section>

      <PagePopup page="home" />
    </div>
  );
}
