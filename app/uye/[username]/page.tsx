import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Önce profiles tablosunda ara
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, created_at")
    .eq("username", username)
    .maybeSingle();

  // Bulunamazsa admin_profile'a bak
  let isAdmin = false;
  let adminProfile: { username: string; avatar_url: string | null } | null = null;
  if (!profile) {
    const { data: ap } = await supabase
      .from("admin_profile")
      .select("username, avatar_url")
      .eq("username", username)
      .maybeSingle();
    if (!ap) notFound();
    adminProfile = ap;
    isAdmin = true;
  }

  const displayName = profile?.username ?? adminProfile?.username ?? username;
  const avatarUrl   = profile?.avatar_url ?? adminProfile?.avatar_url ?? "";
  const bio         = profile?.bio ?? null;

  // Admin profil adıyla eşleşiyor mu? (üye hesabı açmış admin)
  const { data: ap } = await supabase.from("admin_profile").select("username").eq("id", 1).single();
  const isAdminUsername = ap?.username === username;

  // Tarifleri çek
  let recipes: any[] = [];
  if (isAdmin) {
    // admin_profile üzerinden → submitted_by null tarifler
    const { data } = await supabase
      .from("recipes")
      .select("id, title, slug, category, image_url, created_at")
      .is("submitted_by", null)
      .order("created_at", { ascending: false });
    recipes = data ?? [];
  } else if (isAdminUsername) {
    // Üye hesabı açmış admin → kendi tarifleri + submitted_by null tarifler
    const { data } = await supabase
      .from("recipes")
      .select("id, title, slug, category, image_url, created_at, submitted_by")
      .or(`submitted_by.eq.${profile!.id},submitted_by.is.null`)
      .order("created_at", { ascending: false });
    recipes = data ?? [];
  } else {
    const { data } = await supabase
      .from("recipes")
      .select("id, title, slug, category, image_url, created_at")
      .eq("submitted_by", profile!.id)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });
    recipes = data ?? [];
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Profil başlık */}
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 mb-10">
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-warm-100"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-3xl font-bold text-brand-600 ring-4 ring-warm-100">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-warm-900">{displayName}</h1>
            {bio && <p className="text-warm-500 mt-1 text-sm max-w-md">{bio}</p>}
            <p className="text-xs text-warm-400 mt-2">
              {recipes.length} tarif paylaşıldı
            </p>
          </div>
        </div>
      </div>

      {/* Tarif grid */}
      {recipes.length === 0 ? (
        <div className="text-center py-20 text-warm-400">
          <p className="text-4xl mb-4">📭</p>
          <p>Henüz paylaşılan tarif yok.</p>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-warm-800 mb-6">
            {displayName} tarafından paylaşılan tarifler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                className="flex flex-col bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <div className="relative h-48 bg-warm-100 shrink-0">
                  {recipe.image_url ? (
                    <Image
                      src={recipe.image_url}
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-5xl text-warm-300">
                      🍳
                    </div>
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
        </>
      )}
    </div>
  );
}
