import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Takipçiler" };
export const dynamic = "force-dynamic";

export default async function TakipcilerPage() {
  const supabase = createAdminClient();

  // admin_follows → follower profilleri
  const { data: follows, count } = await supabase
    .from("admin_follows")
    .select("follower_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  const followerIds = (follows ?? []).map((f: any) => f.follower_id).filter(Boolean);

  const profileMap: Record<string, any> = {};
  if (followerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio")
      .in("id", followerIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  const rows = (follows ?? []).map((f: any) => ({
    ...f,
    profile: profileMap[f.follower_id] ?? null,
  }));

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* Başlık */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Takipçiler</h1>
          <p className="text-warm-500 text-sm mt-1">Hikayeli Yemekler'i takip eden üyeler</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-medium">
          {count ?? 0} takipçi
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center text-warm-400">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-medium">Henüz takipçi yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 text-warm-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Üye</th>
                <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Kullanıcı Adı</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Bio</th>
                <th className="text-right px-5 py-3 font-semibold">Takip Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => {
                const p = row.profile;
                const username = p?.username ?? "—";
                const displayName = p?.full_name ?? p?.username ?? "Silinmiş Kullanıcı";
                return (
                  <tr
                    key={row.follower_id}
                    className={`border-b border-warm-50 hover:bg-warm-50 transition-colors ${i === rows.length - 1 ? "border-b-0" : ""}`}
                  >
                    {/* Avatar + Ad */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p?.avatar_url ? (
                            <Image
                              src={p.avatar_url} alt={displayName}
                              width={36} height={36} className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-brand-600">
                              {displayName[0]?.toUpperCase() ?? "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-warm-900 leading-tight">{displayName}</p>
                          <p className="text-warm-400 text-xs sm:hidden">@{username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-5 py-3 hidden sm:table-cell">
                      {p?.username ? (
                        <Link
                          href={`/uye/${p.username}`}
                          target="_blank"
                          className="text-brand-600 hover:underline font-medium"
                        >
                          @{p.username}
                        </Link>
                      ) : (
                        <span className="text-warm-400">—</span>
                      )}
                    </td>

                    {/* Bio */}
                    <td className="px-5 py-3 hidden md:table-cell text-warm-500 max-w-xs">
                      <p className="truncate">{p?.bio || "—"}</p>
                    </td>

                    {/* Tarih */}
                    <td className="px-5 py-3 text-right text-warm-400 whitespace-nowrap">
                      {fmtDate(row.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
