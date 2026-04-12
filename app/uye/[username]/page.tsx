import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import FollowButton from "@/components/ui/FollowButton";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; category?: string }>;
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
  const { tab = "tarifler", category: catParam } = await searchParams;
  const activeCategory = catParam && catParam !== "all" ? catParam : null;

  const supabase = await createClient();

  // Current user (for follow button)
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // __admin__ special slug
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

  // Normal member profile
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

  // Social links
  const src = profile ?? ap ?? {};
  const socials = [
    { key: "instagram", url: src.instagram, icon: "📸", label: "Instagram" },
    { key: "twitter",   url: src.twitter,   icon: "𝕏",  label: "X / Twitter" },
    { key: "youtube",   url: src.youtube,   icon: "▶️", label: "YouTube" },
    { key: "website",   url: src.website,   icon: "🎵", label: "TikTok" },
  ].filter((s) => s.url);

  // Stats: follower / following / recipe / post counts (only for real members)
  let followerCount  = 0;
  let followingCount = 0;
  let recipeCount    = 0;
  let postCount      = 0;
  let isFollowing    = false;

  if (!isAdmin && profileId) {
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
  } else if (isAdmin) {
    const { count } = await supabase.from("recipes").select("*", { count: "exact", head: true }).is("submitted_by", null);
    recipeCount = count ?? 0;
  }

  const baseUrl = `/uye/${username}`;

  // Recipes query
  let recipesQuery = supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, created_at");

  if (isAdmin) {
    recipesQuery = recipesQuery.is("submitted_by", null);
  } else {
    recipesQuery = recipesQuery.eq("submitted_by", profileId!).eq("approval_status", "approved");
  }
  if (activeCategory) recipesQuery = (recipesQuery as any).eq("category", activeCategory);
  const { data: recipes } = await recipesQuery.order("created_at", { ascending: false });
  const allRecipes = recipes ?? [];

  // Posts query (only for members, not admin)
  let allPosts: any[] = [];
  if (!isAdmin && tab === "yazilar") {
    const { data: posts } = await supabase
      .from("member_posts")
      .select("id, title, slug, excerpt, image_url, created_at")
      .eq("submitted_by", profileId!)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });
    allPosts = posts ?? [];
  }

  // Can show follow button?
  const canFollow = !isAdmin && currentUser && currentUser.id !== profileId;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Profile Header ── */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden mb-6">
        {/* Cover gradient */}
        <div className="h-24 bg-gradient-to-r from-brand-100 via-warm-100 to-brand-50" />

        <div className="px-6 pb-6">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between -mt-10 mb-4 flex-wrap gap-3">
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-sm" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-3xl font-bold text-brand-600 ring-4 ring-white shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {canFollow && (
              <div className="mt-2">
                <FollowButton targetUserId={profileId!} initialFollowing={isFollowing} />
              </div>
            )}
          </div>

          {/* Name + handle */}
          <div className="mb-3">
            <h1 className="text-xl font-bold text-warm-900 leading-tight">{displayName}</h1>
            {profile?.username && (
              <p className="text-sm text-warm-400">@{handle}</p>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-sm text-warm-600 leading-relaxed mb-4 max-w-lg">{bio}</p>
          )}

          {/* Stats */}
          {!isAdmin && (
            <div className="flex flex-wrap gap-5 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-warm-900">{recipeCount}</p>
                <p className="text-xs text-warm-400">Tarif</p>
              </div>
              <div className="w-px bg-warm-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-warm-900">{postCount}</p>
                <p className="text-xs text-warm-400">Yazı</p>
              </div>
              <div className="w-px bg-warm-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-warm-900">{followerCount}</p>
                <p className="text-xs text-warm-400">Takipçi</p>
              </div>
              <div className="w-px bg-warm-100" />
              <div className="text-center">
                <p className="text-lg font-bold text-warm-900">{followingCount}</p>
                <p className="text-xs text-warm-400">Takip</p>
              </div>
            </div>
          )}

          {/* Social links */}
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a key={s.key} href={s.url!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-50 border border-warm-200 text-warm-600 text-xs font-medium hover:border-brand-300 hover:text-brand-600 transition-colors">
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      {!isAdmin && (
        <div className="flex gap-1 mb-6 bg-warm-100 p-1 rounded-2xl">
          {[
            { key: "tarifler", label: "Tarifleri", count: recipeCount },
            { key: "yazilar",  label: "Yazıları",  count: postCount },
          ].map((t) => (
            <Link key={t.key} href={`${baseUrl}?tab=${t.key}`}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === t.key
                  ? "bg-white text-warm-900 shadow-sm"
                  : "text-warm-500 hover:text-warm-700",
              ].join(" ")}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-brand-100 text-brand-600" : "bg-warm-200 text-warm-500"
              }`}>{t.count}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Recipes Tab ── */}
      {(isAdmin || tab === "tarifler") && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const isActive = cat.key === "all" ? !activeCategory : activeCategory === cat.key;
              const href = cat.key === "all"
                ? (isAdmin ? baseUrl : `${baseUrl}?tab=tarifler`)
                : (isAdmin ? `${baseUrl}?category=${cat.key}` : `${baseUrl}?tab=tarifler&category=${cat.key}`);
              return (
                <Link key={cat.key} href={href}
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
          )}
        </>
      )}

      {/* ── Posts Tab ── */}
      {!isAdmin && tab === "yazilar" && (
        <>
          {allPosts.length === 0 ? (
            <EmptyState icon="✍️" text="Henüz paylaşılan yazı yok." />
          ) : (
            <div className="space-y-4">
              {allPosts.map((post) => (
                <Link key={post.id} href={`/yazi/${post.slug}`}
                  className="flex gap-4 bg-white rounded-2xl border border-warm-100 shadow-sm p-4 hover:shadow-md hover:border-brand-200 transition-all group">
                  {post.image_url ? (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-warm-100">
                      <Image src={post.image_url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
