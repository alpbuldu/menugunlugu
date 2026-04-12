import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ category?: string }>;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",     label: "Tümü" },
  { key: "soup",    label: "Çorbalar" },
  { key: "main",    label: "Ana Yemekler" },
  { key: "side",    label: "Yardımcı Lezzetler" },
  { key: "dessert", label: "Tatlılar" },
];

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username }          = await params;
  const { category: catParam } = await searchParams;
  const activeCategory = catParam && catParam !== "all" ? catParam : null;

  const supabase = await createClient();

  // __admin__ özel slug → admin profili
  let isAdmin = false;
  let adminProfile: { username: string; avatar_url: string | null } | null = null;

  if (username === "__admin__") {
    const { data: ap } = await supabase
      .from("admin_profile")
      .select("username, avatar_url")
      .eq("id", 1)
      .maybeSingle();
    if (!ap) notFound();
    adminProfile = ap;
    isAdmin = true;
  }

  // Normal üye profili
  const { data: profile } = isAdmin
    ? { data: null }
    : await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, full_name, instagram, twitter, youtube, website, created_at")
        .eq("username", username)
        .maybeSingle();

  if (!isAdmin && !profile) notFound();

  const displayName = profile?.full_name || profile?.username || adminProfile?.username || username;
  const handle      = profile?.username || adminProfile?.username || username;
  const avatarUrl   = profile?.avatar_url || adminProfile?.avatar_url || "";
  const bio         = profile?.bio || null;

  // Sosyal medya
  const socials = profile ? [
    { key: "instagram", url: profile.instagram, icon: "📸", label: "Instagram" },
    { key: "twitter",   url: profile.twitter,   icon: "🐦", label: "X / Twitter" },
    { key: "youtube",   url: profile.youtube,   icon: "▶️", label: "YouTube" },
    { key: "website",   url: profile.website,   icon: "🌐", label: "Web Site" },
  ].filter((s) => s.url) : [];

  // Tarifleri çek
  let query = supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, created_at");

  if (isAdmin) {
    query = query.is("submitted_by", null);
  } else {
    query = query.eq("submitted_by", profile!.id).eq("approval_status", "approved");
  }

  if (activeCategory) query = (query as any).eq("category", activeCategory);

  const { data: recipes } = await query.order("created_at", { ascending: false });
  const allRecipes = recipes ?? [];

  // Toplam sayı (filtre olmadan)
  let totalCount = allRecipes.length;
  if (activeCategory) {
    let countQuery = supabase.from("recipes").select("id", { count: "exact", head: true });
    if (isAdmin) countQuery = countQuery.is("submitted_by", null);
    else countQuery = countQuery.eq("submitted_by", profile!.id).eq("approval_status", "approved");
    const { count } = await countQuery;
    totalCount = count ?? 0;
  }

  const baseUrl = `/uye/${username}`;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profil başlık */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-warm-100 flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-3xl font-bold text-brand-600 ring-4 ring-warm-100 flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Bilgiler */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-warm-900">{displayName}</h1>
            {profile?.full_name && profile.username && (
              <p className="text-sm text-warm-400 mt-0.5">@{handle}</p>
            )}
            {bio && <p className="text-warm-500 mt-2 text-sm max-w-lg leading-relaxed">{bio}</p>}
            <p className="text-xs text-warm-400 mt-2">{totalCount} tarif paylaşıldı</p>

            {/* Sosyal medya */}
            {socials.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
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
      </div>

      {/* Kategori filtresi */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === "all" ? !activeCategory : activeCategory === cat.key;
          return (
            <Link key={cat.key}
              href={cat.key === "all" ? baseUrl : `${baseUrl}?category=${cat.key}`}
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

      {/* Tarif grid */}
      {allRecipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">📭</p>
          <p>{activeCategory ? "Bu kategoride tarif yok." : "Henüz paylaşılan tarif yok."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.slug}`}
              className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
              <div className="relative h-48 bg-warm-100 shrink-0">
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt={recipe.title} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl text-warm-300">🍳</div>
                )}
              </div>
              <div className="p-5">
                <Badge category={recipe.category as Category} />
                <h3 className="text-base font-semibold text-warm-800 mt-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {recipe.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
