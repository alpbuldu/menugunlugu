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
}

export default async function YazarlarPage() {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, instagram, twitter, youtube, website, created_at, username_change_count")
    .order("created_at", { ascending: false });

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

  // Recipe counts, post counts, follower counts
  const ids = profiles.map((p) => p.id);

  const [{ data: recipeCounts }, { data: postCounts }, { data: followerCounts }] = await Promise.all([
    supabase
      .from("recipes")
      .select("submitted_by")
      .in("submitted_by", ids)
      .eq("approval_status", "approved"),
    supabase
      .from("member_posts")
      .select("submitted_by")
      .in("submitted_by", ids)
      .eq("approval_status", "approved"),
    supabase
      .from("follows")
      .select("following_id")
      .in("following_id", ids),
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
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Yazarlar</h1>
          <p className="text-sm text-warm-400 mt-0.5">{profiles.length} kayıtlı üye</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-warm-50 border-b border-warm-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Üye</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Tarif</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Yazı</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">Takipçi</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Kullanıcı Adı Değişimi</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Katılım</th>
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
                      <p className="font-medium text-warm-800 truncate">
                        {p.full_name || p.username}
                      </p>
                      <p className="text-xs text-warm-400">@{p.username}</p>
                    </div>
                  </div>
                </td>

                {/* Tarif sayısı */}
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-warm-700 font-medium">{p.recipe_count}</span>
                </td>

                {/* Yazı sayısı */}
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <span className="text-warm-700 font-medium">{p.post_count}</span>
                </td>

                {/* Takipçi */}
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-warm-700 font-medium">{p.follower_count}</span>
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
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-warm-400 whitespace-nowrap">
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
  );
}
