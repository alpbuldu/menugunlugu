import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBlogCategories } from "@/lib/supabase/queries";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; category?: string; blogcat?: string; page?: string }>;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",     label: "Tümü" },
  { key: "soup",    label: "Çorbalar" },
  { key: "main",    label: "Ana Yemekler" },
  { key: "side",    label: "Yardımcı Lezzetler" },
  { key: "dessert", label: "Tatlılar" },
];

const SocialIcon = ({ type }: { type: string }) => {
  if (type === "instagram") return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" /></svg>;
  if (type === "twitter")   return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.635 5.903-5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  if (type === "youtube")   return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" /></svg>;
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" /></svg>;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username }           = await params;
  const { tab = "tarifler", category: catParam, blogcat: blogCatParam, page: pageParam } = await searchParams;
  const activeCategory    = catParam    && catParam    !== "all" ? catParam    : null;
  const activeBlogCat     = blogCatParam && blogCatParam !== "all" ? blogCatParam : null;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const blogCategories = await getBlogCategories();

  let isAdmin = false;
  let adminProfile: any = null;

  const { data: apData } = await supabase
    .from("admin_profile")
    .select("username, avatar_url, full_name, bio, instagram, twitter, youtube, website")
    .eq("id", 1)
    .maybeSingle();

  if (username === "__admin__" || (apData && apData.username === username)) {
    if (!apData) notFound();
    adminProfile = apData;
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
    { key: "instagram", url: src.instagram, label: "Instagram" },
    { key: "twitter",   url: src.twitter,   label: "X" },
    { key: "youtube",   url: src.youtube,   label: "YouTube" },
    { key: "website",   url: src.website,   label: "TikTok" },
  ].filter((s) => s.url);

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

  const showFollowButton = isAdmin ? true : currentUser?.id !== profileId;
  const baseUrl = `/uye/${username}`;

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
      let bpQuery = supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, image_url, created_at, category_id, blog_categories:category_id(name, slug)")
        .eq("published", true);
      const all = (await bpQuery.order("created_at", { ascending: false })).data ?? [];
      const filtered = activeBlogCat
        ? all.filter((p: any) => (p.blog_categories as any)?.slug === activeBlogCat)
        : all;
      postsTotalPages = Math.ceil(filtered.length / PER_PAGE);
      allPosts = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
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

  function pageHref(overrides: { tab?: string; category?: string; blogcat?: string; page?: number }) {
    const p = new URLSearchParams();
    const t = overrides.tab ?? tab;
    if (t !== "tarifler") p.set("tab", t);
    const cat = "category" in overrides ? overrides.category : activeCategory;
    if (cat) p.set("category", cat);
    const bc = "blogcat" in overrides ? overrides.blogcat : activeBlogCat;
    if (bc) p.set("blogcat", bc);
    const pg = overrides.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `${baseUrl}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* ── Cover + Profil Header ── */}
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 h-32 sm:h-44" />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profil kartı — cover üzerine bindiriyor */}
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm -mt-12 sm:-mt-16 mb-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">

            {/* Sol: avatar + isim */}
            <div className="flex items-end gap-4 -mt-12 sm:-mt-14 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-md" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-3xl font-bold text-brand-700 ring-4 ring-white shadow-md">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pb-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-warm-900 leading-snug truncate">{displayName}</h1>
                {handle && handle !== displayName && (
                  <p className="text-xs text-warm-400 mt-0.5">@{handle}</p>
                )}
              </div>
            </div>

            {/* Sağ: Takip Et — mobilde ikon, masaüstünde yazılı */}
            {showFollowButton && (
              <div className="flex-shrink-0 pt-1">
                <span className="sm:hidden">
                  <FollowButton
                    targetUserId={isAdmin ? undefined : profileId!}
                    isAdminProfile={isAdmin}
                    initialFollowing={isFollowing}
                    isLoggedIn={!!currentUser}
                    size="icon"
                  />
                </span>
                <span className="hidden sm:block">
                  <FollowButton
                    targetUserId={isAdmin ? undefined : profileId!}
                    isAdminProfile={isAdmin}
                    initialFollowing={isFollowing}
                    isLoggedIn={!!currentUser}
                    size="sm"
                  />
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-sm text-warm-500 leading-relaxed mt-4">{bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-warm-100">
            <Link href={pageHref({ tab: "tarifler", page: 1 })} className="flex flex-col items-center group">
              <span className="text-base font-bold text-warm-900 group-hover:text-brand-600 transition-colors leading-none">{recipeCount}</span>
              <span className="text-[11px] text-warm-400 mt-0.5">Tarif</span>
            </Link>
            <div className="w-px h-6 bg-warm-100" />
            <Link href={pageHref({ tab: "yazilar", page: 1 })} className="flex flex-col items-center group">
              <span className="text-base font-bold text-warm-900 group-hover:text-brand-600 transition-colors leading-none">{postCount}</span>
              <span className="text-[11px] text-warm-400 mt-0.5">Yazı</span>
            </Link>
            <div className="w-px h-6 bg-warm-100" />
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-warm-900 leading-none">{followerCount}</span>
              <span className="text-[11px] text-warm-400 mt-0.5">Takipçi</span>
            </div>
            {!isAdmin && followingCount > 0 && (
              <>
                <div className="w-px h-6 bg-warm-100" />
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-warm-900 leading-none">{followingCount}</span>
                  <span className="text-[11px] text-warm-400 mt-0.5">Takip</span>
                </div>
              </>
            )}
          </div>

          {/* Sosyal medya */}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {socials.map((s) => (
                <a key={s.key} href={s.url!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-50 border border-warm-200 text-warm-600 text-xs font-medium hover:border-brand-300 hover:text-brand-600 transition-colors">
                  <SocialIcon type={s.key} /><span>{s.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-5 bg-white border border-warm-100 shadow-sm p-1 rounded-2xl">
          {[
            { key: "tarifler", label: "Tarifleri", count: recipeCount, icon: "🍳" },
            { key: "yazilar",  label: "Yazıları",  count: postCount,   icon: "✍️" },
          ].map((t) => (
            <Link key={t.key} href={`${baseUrl}?tab=${t.key}`}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === t.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-warm-500 hover:text-warm-800 hover:bg-warm-50",
              ].join(" ")}>
              <span className="hidden sm:inline">{t.icon}</span>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? "bg-white/20 text-white" : "bg-warm-100 text-warm-500"
              }`}>{t.count}</span>
            </Link>
          ))}
        </div>

        {/* ── Recipes Tab ── */}
        {tab === "tarifler" && (
          <>
            {/* Kategori filtresi — tarifler sayfasıyla aynı tasarım */}
            <div className="flex gap-1 sm:flex-wrap sm:gap-2 mb-4 sm:mb-6">
              {CATEGORIES.map((cat) => {
                const isActive = cat.key === "all" ? !activeCategory : activeCategory === cat.key;
                return (
                  <Link key={cat.key}
                    href={pageHref({ tab: "tarifler", category: cat.key === "all" ? undefined : cat.key, page: 1 })}
                    className={`flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {allRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
                      <Link href={`/tarifler/${recipe.slug}`} className="flex flex-col flex-1">
                        <div className="relative h-28 sm:h-40 bg-warm-100 shrink-0">
                          {recipe.image_url ? (
                            <Image src={recipe.image_url} alt={recipe.title} fill
                              sizes="(max-width: 640px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-5xl text-warm-300">🍳</div>
                          )}
                        </div>
                        <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
                          <Badge category={recipe.category as Category} className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5" />
                          <h2 className="text-sm sm:text-base font-semibold text-warm-800 mt-1.5 sm:mt-2 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                            {recipe.title}
                          </h2>
                        </div>
                      </Link>
                      {/* Yazar satırı — /tarifler ile aynı */}
                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2.5 sm:pb-3 pt-1.5 sm:pt-2 border-t border-warm-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={handle} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              {handle.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-warm-300 leading-none sm:mb-0.5">Yazar</span>
                            <span className="text-[10px] sm:text-xs font-medium text-warm-500 truncate">{handle}</span>
                          </div>
                        </div>
                        {showFollowButton && (
                          <>
                            <span className="sm:hidden flex-shrink-0">
                              <FollowButton targetUserId={isAdmin ? undefined : profileId!} isAdminProfile={isAdmin} initialFollowing={isFollowing} isLoggedIn={!!currentUser} size="icon" />
                            </span>
                            <span className="hidden sm:block flex-shrink-0">
                              <FollowButton targetUserId={isAdmin ? undefined : profileId!} isAdminProfile={isAdmin} initialFollowing={isFollowing} isLoggedIn={!!currentUser} size="xs" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
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
            {/* Blog kategori filtresi — blog sayfasıyla aynı tasarım */}
            {isAdmin && blogCategories.length > 0 && (
              <div className="flex gap-1 sm:flex-wrap sm:gap-2 mb-4 sm:mb-6">
                <Link
                  href={pageHref({ tab: "yazilar", blogcat: undefined, page: 1 })}
                  className={`flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
                    !activeBlogCat
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
                  }`}>
                  Tümü
                </Link>
                {blogCategories.map((cat: any) => (
                  <Link key={cat.id}
                    href={pageHref({ tab: "yazilar", blogcat: cat.slug, page: 1 })}
                    className={`flex-1 sm:flex-none flex items-center justify-center py-1.5 sm:py-2 px-1 sm:px-4 rounded-lg sm:rounded-full text-[10px] sm:text-sm font-medium border leading-tight transition-colors text-center ${
                      activeBlogCat === cat.slug
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white border-warm-200 text-warm-700 hover:border-brand-300 hover:text-brand-700"
                    }`}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {allPosts.length === 0 ? (
              <EmptyState icon="✍️" text="Henüz paylaşılan yazı yok." />
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {allPosts.map((post) => (
                    <div key={post.id} className="flex flex-col bg-white rounded-xl sm:rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
                      <Link href={`${postLinkBase}/${post.slug}`} className="flex flex-col flex-1">
                        <div className="relative h-28 sm:h-40 bg-warm-100 shrink-0">
                          {post.image_url ? (
                            <Image src={post.image_url} alt={post.title} fill
                              sizes="(max-width: 640px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-5xl text-warm-300">✍️</div>
                          )}
                        </div>
                        <div className="px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
                          <h2 className="text-sm sm:text-base font-semibold text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-[11px] sm:text-xs text-warm-400 mt-1 line-clamp-2 hidden sm:block">{post.excerpt}</p>
                          )}
                          <p className="text-[10px] sm:text-xs text-warm-300 mt-1.5 sm:mt-2">
                            {new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                          </p>
                        </div>
                      </Link>
                      {/* Yazar satırı — /tarifler ile aynı */}
                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 pb-2.5 sm:pb-3 pt-1.5 sm:pt-2 border-t border-warm-100">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={handle} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                              {handle.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-warm-300 leading-none sm:mb-0.5">Yazar</span>
                            <span className="text-[10px] sm:text-xs font-medium text-warm-500 truncate">{handle}</span>
                          </div>
                        </div>
                        {showFollowButton && (
                          <>
                            <span className="sm:hidden flex-shrink-0">
                              <FollowButton targetUserId={isAdmin ? undefined : profileId!} isAdminProfile={isAdmin} initialFollowing={isFollowing} isLoggedIn={!!currentUser} size="icon" />
                            </span>
                            <span className="hidden sm:block flex-shrink-0">
                              <FollowButton targetUserId={isAdmin ? undefined : profileId!} isAdminProfile={isAdmin} initialFollowing={isFollowing} isLoggedIn={!!currentUser} size="xs" />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination current={currentPage} total={postsTotalPages} hrefFn={(p) => pageHref({ tab: "yazilar", page: p })} />
              </>
            )}
          </>
        )}

        <div className="pb-10" />
      </div>
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
  const btn      = "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-medium border transition-colors";
  const inactive = `${btn} bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600`;
  const active   = `${btn} bg-brand-600 border-brand-600 text-white`;
  const disabled = `${btn} border-warm-100 text-warm-300 cursor-default`;
  const WINDOW = 3;
  let start = Math.max(1, current - Math.floor(WINDOW / 2));
  let end   = Math.min(total, start + WINDOW - 1);
  if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      {current > 1 ? <Link href={hrefFn(1)}           className={inactive}>«</Link> : <span className={disabled}>«</span>}
      {current > 1 ? <Link href={hrefFn(current - 1)} className={inactive}>‹</Link> : <span className={disabled}>‹</span>}
      {pages.map((p) => (
        <Link key={p} href={hrefFn(p)} className={p === current ? active : inactive}>{p}</Link>
      ))}
      {current < total ? <Link href={hrefFn(current + 1)} className={inactive}>›</Link> : <span className={disabled}>›</span>}
      {current < total ? <Link href={hrefFn(total)}       className={inactive}>»</Link> : <span className={disabled}>»</span>}
    </div>
  );
}
