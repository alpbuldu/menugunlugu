import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; category?: string; page?: string }>;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",     label: "Tümü" },
  { key: "soup",    label: "Çorbalar" },
  { key: "main",    label: "Ana Yemekler" },
  { key: "side",    label: "Yardımcı Lezzetler" },
  { key: "dessert", label: "Tatlılar" },
];

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username }           = await params;
  const { tab = "tarifler", category: catParam, page: pageParam } = await searchParams;
  const activeCategory = catParam && catParam !== "all" ? catParam : null;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  let isAdmin = false;
  let adminProfile: any = null;

  if (username === "__admin__") {
    const { data: ap } = await supabase
      .from("admin_profile")
      .select("username, avatar_url, full_name, bio, instagram, twitter, youtube, website")
      .eq("id", 1)
      .maybeSingle();
    if (!ap) notFound();
    adminProfile = ap;
    isAdmin = true;
  }

  const { data: profile } = isAdmin
    ? { data: null }
    : await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, full_name, instagram, twitter, youtube, website, created_at")
        .eq("username", username)
        .maybeSingle();

  if (!isAdmin && !profile) notFound();

  const ap = adminProfile;
  const displayName = profile?.full_name || ap?.full_name || profile?.username || ap?.username || username;
  const handle      = profile?.username  || ap?.username  || username;
  const avatarUrl   = profile?.avatar_url || ap?.avatar_url || "";
  const bio         = profile?.bio || ap?.bio || null;
  const profileId   = profile?.id ?? null;

  const src = profile ?? ap ?? {};
  const socials = [
    { key: "instagram", url: src.instagram, label: "Instagram", svg: <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" /></svg> },
    { key: "twitter",   url: src.twitter,   label: "X / Twitter", svg: <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.903-5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { key: "youtube",   url: src.youtube,   label: "YouTube", svg: <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" /></svg> },
    { key: "website",   url: src.website,   label: "TikTok", svg: <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" /></svg> },
  ].filter((s) => s.url);

  // Stats
  let followerCount  = 0;
  let followingCount = 0;
  let recipeCount    = 0;
  let postCount      = 0;
  let isFollowing    = false;

  if (isAdmin) {
    const [recipeRes, postRes, followerRes, followCheckRes] = await Promise.all([
      supabase.from("recipes").select("*", { count: "exact", head: true }).is("submitted_by", null),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
      supabase.from("admin_follows").select("*", { count: "exact", head: true }),
      currentUser
        ? supabase.from("admin_follows").select("follower_id").eq("follower_id", currentUser.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    recipeCount   = recipeRes.count   ?? 0;
    postCount     = postRes.count     ?? 0;
    followerCount = followerRes.count ?? 0;
    isFollowing   = !!(followCheckRes as any).data;
  } else if (profileId) {
    const [followerRes, followingRes, recipeRes, postRes, followCheckRes] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      supabase.from("recipes").select("*", { count: "exact", head: true }).eq("submitted_by", profileId).eq("approval_status", "approved"),
      supabase.from("member_posts").select("*", { count: "exact", head: true }).eq("submitted_by", profileId).eq("approval_status", "approved"),
      currentUser && currentUser.id !== profileId
        ? supabase.from("follows").select("follower_id").eq("follower_id", currentUser.id).eq("following_id", profileId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    followerCount  = followerRes.count  ?? 0;
    followingCount = followingRes.count ?? 0;
    recipeCount    = recipeRes.count    ?? 0;
    postCount      = postRes.count      ?? 0;
    isFollowing    = !!(followCheckRes as any).data;
  }

  const baseUrl = `/uye/${username}`;
  // Admin kendi profil sayfasını zaten düzenlemiyor, follow butonu her giriş yapmış kullanıcıya göster
  // Kendi profilinde gösterme, diğer herkese göster (giriş yapmamışsa login'e yönlendir)
  const showFollowButton = isAdmin ? true : currentUser?.id !== profileId;

  // Recipes
  let recipesQuery = supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, created_at");
  if (isAdmin) {
    recipesQuery = recipesQuery.is("submitted_by", null);
  } else {
    recipesQuery = recipesQuery.eq("submitted_by", profileId!).eq("approval_status", "approved");
  }
  if (activeCategory) recipesQuery = (recipesQuery as any).eq("category", activeCategory);
  const { data: recipesAll } = await recipesQuery.order("created_at", { ascending: false });
  const allRecipesTotal = recipesAll ?? [];
  const recipesTotalPages = Math.ceil(allRecipesTotal.length / PER_PAGE);
  const allRecipes = allRecipesTotal.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Posts
  let allPosts: any[] = [];
  let postsTotalPages = 1;
  if (tab === "yazilar") {
    if (isAdmin) {
      const { data: bp } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      const all = bp ?? [];
      postsTotalPages = Math.ceil(all.length / PER_PAGE);
      allPosts = all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    } else if (profileId) {
      const { data: mp } = await supabase
        .from("member_posts")
        .select("id, title, slug, excerpt, image_url, created_at")
        .eq("submitted_by", profileId)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      const all = mp ?? [];
      postsTotalPages = Math.ceil(all.length / PER_PAGE);
      allPosts = all.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    }
  }

  const postLinkBase = isAdmin ? "/blog" : "/yazi";

  function pageHref(overrides: { tab?: string; category?: string; page?: number }) {
    const p = new URLSearchParams();
    const t = overrides.tab ?? tab;
    if (t !== "tarifler") p.set("tab", t);
    const cat = "category" in overrides ? overrides.category : activeCategory;
    if (cat) p.set("category", cat);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `${baseUrl}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Profil Header ── */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm mb-6 overflow-hidden relative">

        {/* Yazar bandı */}
        <div className="h-20 sm:h-24 bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600" />

        {/* Takip Et butonu — band'ın hemen altında sağ köşe */}
        {showFollowButton && (
          <div className="absolute right-5 top-[92px] sm:right-10 sm:top-[110px]">
            <FollowButton
              targetUserId={isAdmin ? undefined : profileId!}
              isAdminProfile={isAdmin}
              initialFollowing={isFollowing}
              isLoggedIn={!!currentUser}
              size="md"
            />
          </div>
        )}

        {/* İçerik — avatar bandı üzerine bindiriyor */}
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">

          {/* Avatar — tek başına, banda biniyor */}
          <div className="-mt-9 sm:-mt-11 mb-3 flex-shrink-0 w-fit">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white shadow-sm" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-2xl sm:text-3xl font-bold text-brand-700 ring-4 ring-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* İsim */}
          <div className="mb-1.5">
            <h1 className="text-base sm:text-lg font-bold text-warm-900 leading-snug">{displayName}</h1>
            {handle && handle !== displayName && (
              <p className="text-xs text-warm-400 mt-0.5">@{handle}</p>
            )}
          </div>

          {bio && (
            <p className="text-sm text-warm-500 leading-relaxed mb-2">{bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`${baseUrl}?tab=tarifler`} className="flex items-baseline gap-1 group">
              <span className="text-sm font-bold text-warm-900 group-hover:text-brand-600 transition-colors">{recipeCount}</span>
              <span className="text-xs text-warm-400 group-hover:text-brand-500 transition-colors">tarif</span>
            </Link>
            <span className="w-px h-3 bg-warm-200" />
            <Link href={`${baseUrl}?tab=yazilar`} className="flex items-baseline gap-1 group">
              <span className="text-sm font-bold text-warm-900 group-hover:text-brand-600 transition-colors">{postCount}</span>
              <span className="text-xs text-warm-400 group-hover:text-brand-500 transition-colors">yazı</span>
            </Link>
            <span className="w-px h-3 bg-warm-200" />
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-warm-900">{followerCount}</span>
              <span className="text-xs text-warm-400">takipçi</span>
            </div>
          </div>

          {/* Socials — tam genişlik, alta */}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-warm-100">
              {socials.map((s) => (
                <a key={s.key} href={s.url!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warm-50 border border-warm-200 text-warm-600 text-xs font-medium hover:border-brand-300 hover:text-brand-600 transition-colors">
                  <span className="flex-shrink-0">{s.svg}</span><span>{s.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 bg-warm-100 p-1 rounded-2xl">
        {[
          { key: "tarifler", label: "Tarifleri", count: recipeCount },
          { key: "yazilar",  label: "Yazıları",  count: postCount },
        ].map((t) => (
          <Link key={t.key} href={`${baseUrl}?tab=${t.key}`}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
              tab === t.key ? "bg-white text-warm-900 shadow-sm" : "text-warm-500 hover:text-warm-700",
            ].join(" ")}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? "bg-brand-100 text-brand-600" : "bg-warm-200 text-warm-500"
            }`}>{t.count}</span>
          </Link>
        ))}
      </div>

      {/* ── Recipes Tab ── */}
      {tab === "tarifler" && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const isActive = cat.key === "all" ? !activeCategory : activeCategory === cat.key;
              return (
                <Link key={cat.key}
                  href={pageHref({ tab: "tarifler", category: cat.key === "all" ? undefined : cat.key, page: 1 })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
                  }`}>
                  {cat.label}
                </Link>
              );
            })}
          </div>
          {allRecipes.length === 0 ? (
            <EmptyState icon="📭" text={activeCategory ? "Bu kategoride tarif yok." : "Henüz paylaşılan tarif yok."} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {allRecipes.map((recipe) => (
                  <Link key={recipe.id} href={`/recipes/${recipe.slug}`}
                    className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
                    <div className="relative h-44 bg-warm-100 shrink-0">
                      {recipe.image_url ? (
                        <Image src={recipe.image_url} alt={recipe.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl text-warm-300">🍳</div>
                      )}
                    </div>
                    <div className="p-4">
                      <Badge category={recipe.category as Category} />
                      <h3 className="text-sm font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {recipe.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination current={currentPage} total={recipesTotalPages} hrefFn={(p) => pageHref({ tab: "tarifler", page: p })} />
            </>
          )}
        </>
      )}

      {/* ── Posts Tab ── */}
      {tab === "yazilar" && (
        <>
          {allPosts.length === 0 ? (
            <EmptyState icon="✍️" text="Henüz paylaşılan yazı yok." />
          ) : (
            <>
              <div className="space-y-4">
                {allPosts.map((post) => (
                  <Link key={post.id} href={`${postLinkBase}/${post.slug}`}
                    className="flex gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-4 hover:shadow-md hover:border-brand-200 transition-all group">
                    {post.image_url ? (
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-warm-100">
                        <Image src={post.image_url} alt={post.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 flex-shrink-0 rounded-xl bg-brand-50 flex items-center justify-center text-3xl">✍️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-warm-900 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-warm-500 mt-1 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      )}
                      <p className="text-xs text-warm-400 mt-2">
                        {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination current={currentPage} total={postsTotalPages} hrefFn={(p) => pageHref({ tab: "yazilar", page: p })} />
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-warm-100 p-16 text-center text-warm-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Pagination({ current, total, hrefFn }: { current: number; total: number; hrefFn: (p: number) => string }) {
  if (total <= 1) return null;
  const btnBase = "inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium border transition-colors";
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
      {current > 1 ? (
        <Link href={hrefFn(current - 1)} className={`${btnBase} bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600`}>‹</Link>
      ) : (
        <span className={`${btnBase} border-warm-100 text-warm-300 cursor-default`}>‹</span>
      )}
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => {
        const show = p === 1 || p === total || Math.abs(p - current) <= 1;
        const ellipsisBefore = p === current - 2 && current - 2 > 1;
        const ellipsisAfter  = p === current + 2 && current + 2 < total;
        if (!show) return null;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {ellipsisBefore && <span className="text-warm-400 text-sm px-1">…</span>}
            <Link href={hrefFn(p)}
              className={`${btnBase} ${p === current ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"}`}>
              {p}
            </Link>
            {ellipsisAfter && <span className="text-warm-400 text-sm px-1">…</span>}
          </span>
        );
      })}
      {current < total ? (
        <Link href={hrefFn(current + 1)} className={`${btnBase} bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600`}>›</Link>
      ) : (
        <span className={`${btnBase} border-warm-100 text-warm-300 cursor-default`}>›</span>
      )}
    </div>
  );
}
