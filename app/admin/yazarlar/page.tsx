import { createAdminClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import DeleteUserButton from "./DeleteUserButton";

export const metadata: Metadata = { title: "Yazarlar" };
export const dynamic = "force-dynamic";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  website: string | null;
  created_at: string;
  username_change_count: number;
  recipe_count: number;
  post_count: number;
  follower_count: number;
  email: string;
  marketing_consent: boolean;
}

export default async function YazarlarPage() {
  const supabase = createAdminClient();

  const [
    { data: profiles },
    authResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, instagram, twitter, youtube, website, created_at, username_change_count")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const authUsers = authResult.data?.users ?? [];

  if (!profiles || profiles.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-warm-900 mb-6">Yazarlar</h1>
        <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center text-warm-400">
          <p className="text-4xl mb-3">👥</p>
          <p>Henüz kayıtlı üye yok.</p>
        </div>
      </div>
    );
  }

  // Email + marketing consent map from auth users
  const authMap: Record<string, { email: string; marketing_consent: boolean }> = {};
  (authUsers ?? []).forEach((u) => {
    authMap[u.id] = {
      email: u.email ?? "",
      marketing_consent: !!u.user_metadata?.marketing_consent,
    };
  });

  const ids = profiles.map((p) => p.id);

  const [{ data: recipeCounts }, { data: postCounts }, { data: followerCounts }] = await Promise.all([
    supabase.from("recipes").select("submitted_by").in("submitted_by", ids).eq("approval_status", "approved"),
    supabase.from("member_posts").select("submitted_by").in("submitted_by", ids).eq("approval_status", "approved"),
    supabase.from("follows").select("following_id").in("following_id", ids),
  ]);

  const recipeMap:   Record<string, number> = {};
  const postMap:     Record<string, number> = {};
  const followerMap: Record<string, number> = {};

  (recipeCounts   ?? []).forEach((r: any) => { recipeMap[r.submitted_by]   = (recipeMap[r.submitted_by]   ?? 0) + 1; });
  (postCounts     ?? []).forEach((r: any) => { postMap[r.submitted_by]     = (postMap[r.submitted_by]     ?? 0) + 1; });
  (followerCounts ?? []).forEach((r: any) => { followerMap[r.following_id] = (followerMap[r.following_id] ?? 0) + 1; });

  const enriched: Profile[] = profiles.map((p) => ({
    ...p,
    username_change_count: p.username_change_count ?? 0,
    recipe_count:   recipeMap[p.id]   ?? 0,
    post_count:     postMap[p.id]     ?? 0,
    follower_count: followerMap[p.id] ?? 0,
    email:              authMap[p.id]?.email            ?? "",
    marketing_consent:  authMap[p.id]?.marketing_consent ?? false,
  }));

  const marketingCount = enriched.filter((p) => p.marketing_consent).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Yazarlar</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            {profiles.length} kayıtlı üye · {marketingCount} kişi pazarlama mailine onay verdi
          </p>
        </div>
        <a
          href="/api/admin/yazarlar/export"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-xl hover:bg-warm-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV İndir
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-warm-100 shadow-sm">
      <div className="bg-white rounded-2xl overflow-hidden min-w-[900px]">
        <table className="w-full text-sm">
          <thead className="bg-warm-50 border-b border-warm-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Üye</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">E-posta</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Tarif</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Yazı</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">Takipçi</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Sosyal</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">İzin</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Ad Değişimi</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden xl:table-cell">Katılım</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-50">
            {enriched.map((p) => (
              <tr key={p.id} className="hover:bg-warm-50/50 transition-colors">
                {/* Üye */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex-shrink-0">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.username} width={36} height={36}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-600">
                          {(p.full_name || p.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-warm-800 truncate">{p.full_name || p.username}</p>
                      <p className="text-xs text-warm-400">@{p.username}</p>
                    </div>
                  </div>
                </td>

                {/* E-posta */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <a href={`mailto:${p.email}`} className="text-xs text-warm-600 hover:text-brand-600 transition-colors">
                    {p.email}
                  </a>
                </td>

                {/* Tarif */}
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-warm-700 font-medium">{p.recipe_count}</span>
                </td>

                {/* Yazı */}
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-warm-700 font-medium">{p.post_count}</span>
                </td>

                {/* Takipçi */}
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-warm-700 font-medium">{p.follower_count}</span>
                </td>

                {/* Sosyal medya */}
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-2">
                    {p.instagram && (
                      <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="text-warm-400 hover:text-pink-500 transition-colors" title={`@${p.instagram}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {p.twitter && (
                      <a href={`https://twitter.com/${p.twitter}`} target="_blank" rel="noopener noreferrer"
                        className="text-warm-400 hover:text-sky-500 transition-colors" title={`@${p.twitter}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {p.youtube && (
                      <a href={p.youtube.startsWith('http') ? p.youtube : `https://youtube.com/${p.youtube}`} target="_blank" rel="noopener noreferrer"
                        className="text-warm-400 hover:text-red-500 transition-colors" title="YouTube">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}
                    {p.website && (
                      <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer"
                        className="text-warm-400 hover:text-warm-700 transition-colors" title={p.website}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </a>
                    )}
                    {!p.instagram && !p.twitter && !p.youtube && !p.website && (
                      <span className="text-warm-200 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* İzin (marketing consent) */}
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  {p.marketing_consent ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Evet
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-warm-400">
                      Hayır
                    </span>
                  )}
                </td>

                {/* Kullanıcı adı değişimi */}
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.username_change_count >= 3
                      ? "bg-red-100 text-red-700"
                      : p.username_change_count === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-warm-100 text-warm-500"
                  }`}>
                    {p.username_change_count} / 3
                  </span>
                </td>

                {/* Katılım tarihi */}
                <td className="px-4 py-3 hidden xl:table-cell text-xs text-warm-400 whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>

                {/* İşlemler */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/uye/${p.username}`}
                      target="_blank"
                      className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors whitespace-nowrap"
                    >
                      Profili gör →
                    </Link>
                    <DeleteUserButton id={p.id} username={p.username} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
