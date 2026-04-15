import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Recipe } from "@/lib/types";
import UsernameForm from "./UsernameForm";
import ProfileForm from "./ProfileForm";
import DeleteRecipeButton from "./DeleteRecipeButton";
import DeletePostButton from "./DeletePostButton";
import UnfollowButton from "./UnfollowButton";
import LogoutButton from "./LogoutButton";
import FollowButton from "@/components/ui/FollowButton";

export const metadata: Metadata = { title: "Üye Paneli" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending:  { label: "İncelemede", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Yayında",    cls: "bg-green-100 text-green-700"  },
  rejected: { label: "Reddedildi", cls: "bg-red-100 text-red-700"      },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

const PAGE_SIZE      = 12; // tariflerim, defterim, yazılarım
const FOLLOW_SIZE    = 30; // takip paneli

function paginate<T>(arr: T[], page: number, size: number) {
  const total      = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const items      = arr.slice((safePage - 1) * size, safePage * size);
  return { items, safePage, totalPages, total };
}

// searchParams:
//   page  → tariflerim / tarif-defterim / yazılarım / takip-ettiklerim
//   page2 → takipçilerim
interface Props { searchParams: Promise<{ tab?: string; page?: string; page2?: string }> }

export default async function UyePanelPage({ searchParams }: Props) {
  const { tab = "tariflerim", page = "1", page2 = "1" } = await searchParams;
  const pageNum  = Math.max(1, parseInt(page));
  const page2Num = Math.max(1, parseInt(page2));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, full_name, instagram, twitter, youtube, website, username_change_count")
    .eq("id", user.id)
    .single();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, approval_status, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  const { data: favorites } = await supabase
    .from("favorites")
    .select("recipe_id, created_at, recipes(id, title, slug, category, image_url, submitted_by)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: posts } = await supabase
    .from("member_posts")
    .select("id, title, slug, approval_status, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  const { data: following } = await supabase
    .from("follows")
    .select("following_id, created_at, profiles!follows_following_id_fkey(id, username, full_name, avatar_url)")
    .eq("follower_id", user.id)
    .order("created_at", { ascending: false });

  const { data: adminFollowRow } = await supabase
    .from("admin_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .maybeSingle();
  const followsAdmin = !!adminFollowRow;

  const { data: adminProfile } = await supabase
    .from("admin_profile")
    .select("username, avatar_url, full_name")
    .eq("id", 1)
    .maybeSingle();

  const { data: followers } = await supabase
    .from("follows")
    .select("follower_id, created_at, profiles!follows_follower_id_fkey(id, username, full_name, avatar_url)")
    .eq("following_id", user.id)
    .order("created_at", { ascending: false });

  // Favori tariflerdeki yazarlar
  const favMemberIds = [...new Set(
    (favorites ?? []).flatMap((f) => {
      const r = f.recipes as unknown as { submitted_by?: string } | null;
      return r?.submitted_by ? [r.submitted_by] : [];
    })
  )];
  type FavProfile = { username: string; avatar_url: string | null };
  const favProfileMap: Record<string, FavProfile> = {};
  if (favMemberIds.length) {
    const { data: favProfiles } = await supabase
      .from("profiles").select("id, username, avatar_url").in("id", favMemberIds);
    favProfiles?.forEach((p) => { favProfileMap[p.id] = { username: p.username, avatar_url: p.avatar_url ?? null }; });
  }
  const adminUsername  = adminProfile?.username ?? "Menü Günlüğü";
  const adminAvatarUrl = adminProfile?.avatar_url ?? null;

  // Takip ettiklerim: admin önce, sonra üyeler
  type FollowEntry = { type: "admin" } | { type: "member"; id: string; username: string; full_name: string | null; avatar_url: string | null; followingId: string };
  const followingAll: FollowEntry[] = [
    ...(followsAdmin && adminProfile ? [{ type: "admin" as const }] : []),
    ...(following ?? []).map((f) => {
      const p = f.profiles as unknown as { id: string; username: string; full_name: string | null; avatar_url: string | null } | null;
      if (!p) return null;
      return { type: "member" as const, id: p.id, username: p.username, full_name: p.full_name, avatar_url: p.avatar_url, followingId: f.following_id };
    }).filter(Boolean) as FollowEntry[],
  ];

  const followingCount = followingAll.length;
  const followerCount  = followers?.length ?? 0;

  // Tarif defterindeki yazarlar için follow durumu
  const followedMemberSet = new Set((following ?? []).map((f) => f.following_id));
  const favFollowMap: Record<string, boolean> = {};
  favMemberIds.forEach((id) => { favFollowMap[id] = followedMemberSet.has(id); });

  // Sayfalamalar
  const recipesPag   = paginate(recipes   ?? [], pageNum,  PAGE_SIZE);
  const favsPag      = paginate(favorites ?? [], pageNum,  PAGE_SIZE);
  const postsPag     = paginate(posts     ?? [], pageNum,  PAGE_SIZE);
  const followingPag = paginate(followingAll,    pageNum,  FOLLOW_SIZE);
  const followersPag = paginate(followers  ?? [], page2Num, FOLLOW_SIZE);

  const tabs = [
    { key: "tariflerim",     label: "Tariflerim",       count: recipes?.length ?? 0 },
    { key: "tarif-defterim", label: "Tarif Defterim",   count: favorites?.length ?? 0 },
    { key: "yazilarim",      label: "Yazılarım",        count: posts?.length ?? 0 },
    { key: "takip",          label: "Takip Paneli",     count: followingCount + followerCount },
    { key: "panelim",        label: "Hesap Bilgilerim", count: null },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Profil başlık ── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-brand-200">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Profil" width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-brand-600">
                  {(profile?.full_name || profile?.username || user.email || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-warm-900 truncate">
                {profile?.full_name || profile?.username || user.email}
              </h1>
              {profile?.full_name && profile?.username && (
                <p className="text-xs text-warm-400">@{profile.username}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            <Link href="/tarif-ekle"
              className="flex-1 sm:flex-none text-center px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
              + Tarif Ekle
            </Link>
            <Link href="/yazi-ekle"
              className="flex-1 sm:flex-none text-center px-3 py-2 rounded-xl bg-warm-700 hover:bg-warm-800 text-white text-sm font-medium transition-colors">
              + Yazı Ekle
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-8 bg-warm-100 p-1 rounded-2xl sm:overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t.key} href={`/uye/panel?tab=${t.key}`}
            className={[
              "flex-1 min-w-[30%] sm:min-w-0 sm:flex-shrink-0 flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center",
              tab === t.key
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700",
            ].join(" ")}>
            <span className="leading-tight text-center">{t.label}</span>
            {t.count !== null && (
              <span className={[
                "text-xs px-1.5 py-0.5 rounded-full flex-shrink-0",
                tab === t.key ? "bg-brand-100 text-brand-600" : "bg-warm-200 text-warm-500",
              ].join(" ")}>{t.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Tab: Tariflerim ── */}
      {tab === "tariflerim" && (
        <section className="space-y-3">
          <p className="text-xs text-warm-400 mb-4">Gönderdiğiniz tarifler burada listelenir. Onaylanan tarifler sitede yayınlanır; incelemede olanlar ekibimiz tarafından değerlendirilmektedir.</p>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warm-500">{recipesPag.total} tarif</p>
            <Link href="/tarif-ekle" className="text-sm text-brand-600 hover:underline">+ Yeni tarif ekle</Link>
          </div>
          {recipesPag.total === 0 ? (
            <Empty icon="📝" text="Henüz tarif eklemediniz." />
          ) : (
            <>
              {(recipesPag.items as (Recipe & { approval_status: string; created_at: string })[]).map((r) => {
                const s = statusLabel[r.approval_status] ?? statusLabel["pending"];
                return (
                  <div key={r.id} className="bg-white rounded-xl border border-warm-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      {r.image_url ? (
                        <Image src={r.image_url} alt={r.title} width={48} height={48}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-800 text-sm truncate">{r.title}</p>
                        <p className="text-xs text-warm-400">{CATEGORY_LABELS[r.category]} · {formatDate(r.created_at)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-warm-100 bg-warm-50/60">
                      <Link href={`/tarif-duzenle/${r.id}`} className="text-xs text-warm-500 hover:text-brand-600 transition-colors">Düzenle</Link>
                      {r.approval_status === "approved" && (
                        <Link href={`/recipes/${r.slug}`} className="text-xs text-brand-600 hover:underline">Görüntüle</Link>
                      )}
                      <div className="ml-auto"><DeleteRecipeButton recipeId={r.id} /></div>
                    </div>
                  </div>
                );
              })}
              <Pagination tab="tariflerim" page={recipesPag.safePage} totalPages={recipesPag.totalPages} />
            </>
          )}
        </section>
      )}

      {/* ── Tab: Tarif Defterim ── */}
      {tab === "tarif-defterim" && (
        <section>
          <p className="text-xs text-warm-400 mb-3">Beğendiğiniz tarifleri kalp butonuna basarak buraya kaydedebilirsiniz. Kaydettiğiniz tarifler yalnızca size görünür.</p>
          <p className="text-sm text-warm-500 mb-4">{favsPag.total} tarif kaydedildi</p>
          {favsPag.total === 0 ? (
            <Empty icon="📚" text="Tarif defteriniz boş. Tarifleri incelerken ❤️ butona basın." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {favsPag.items.map((fav: any) => {
                  const r = fav.recipes as unknown as (Recipe & { submitted_by?: string | null }) | null;
                  if (!r) return null;
                  const favAuthor: { username: string; avatar_url: string | null } | null = r.submitted_by
                    ? (favProfileMap[r.submitted_by] ?? null)
                    : { username: adminUsername, avatar_url: adminAvatarUrl };
                  const authorIsAdmin = !r.submitted_by;
                  const favInitFollowing = authorIsAdmin ? followsAdmin : (favFollowMap[r.submitted_by!] ?? false);
                  return (
                    <div key={fav.recipe_id} className="group bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                      <Link href={`/recipes/${r.slug}`} className="flex flex-col flex-1">
                        {r.image_url ? (
                          <Image src={r.image_url} alt={r.title} width={200} height={120}
                            className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-28 bg-warm-100 flex items-center justify-center text-2xl">🍽️</div>
                        )}
                        <div className="p-3 flex flex-col flex-1">
                          <p className="text-sm font-medium text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">{r.title}</p>
                          <p className="text-xs text-warm-400 mt-1">{CATEGORY_LABELS[r.category]}</p>
                        </div>
                      </Link>
                      {favAuthor && (
                        <div className="flex items-center gap-1.5 px-3 pb-3 pt-2 border-t border-warm-100">
                          <Link href={`/uye/${favAuthor.username}`} className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                            {favAuthor.avatar_url ? (
                              <img src={favAuthor.avatar_url} alt={favAuthor.username}
                                className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {favAuthor.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="text-[10px] text-warm-400 truncate">{favAuthor.username}</span>
                          </Link>
                          <FollowButton
                            targetUserId={authorIsAdmin ? undefined : r.submitted_by ?? undefined}
                            isAdminProfile={authorIsAdmin}
                            initialFollowing={favInitFollowing}
                            isLoggedIn={true}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Pagination tab="tarif-defterim" page={favsPag.safePage} totalPages={favsPag.totalPages} />
            </>
          )}
        </section>
      )}

      {/* ── Tab: Yazılarım ── */}
      {tab === "yazilarim" && (
        <section className="space-y-3">
          <p className="text-xs text-warm-400 mb-4">Gönderdiğiniz blog yazıları burada listelenir. Onaylanan yazılar blog sayfasında yayınlanır; incelemede olanlar ekibimiz tarafından değerlendirilmektedir.</p>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warm-500">{postsPag.total} yazı</p>
            <Link href="/yazi-ekle" className="text-sm text-brand-600 hover:underline">+ Yeni yazı ekle</Link>
          </div>
          {postsPag.total === 0 ? (
            <Empty icon="✍️" text="Henüz yazı paylaşmadınız." />
          ) : (
            <>
              {postsPag.items.map((p: any) => {
                const s = statusLabel[p.approval_status] ?? statusLabel["pending"];
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-warm-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 text-lg">✍️</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-warm-800 text-sm truncate">{p.title}</p>
                        <p className="text-xs text-warm-400">{formatDate(p.created_at)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-warm-100 bg-warm-50/60">
                      <Link href={`/yazi-duzenle/${p.id}`} className="text-xs text-warm-500 hover:text-brand-600 transition-colors">Düzenle</Link>
                      {p.approval_status === "approved" && (
                        <Link href={`/yazi/${p.slug}`} className="text-xs text-brand-600 hover:underline">Görüntüle</Link>
                      )}
                      <div className="ml-auto"><DeletePostButton postId={p.id} /></div>
                    </div>
                  </div>
                );
              })}
              <Pagination tab="yazilarim" page={postsPag.safePage} totalPages={postsPag.totalPages} />
            </>
          )}
        </section>
      )}

      {/* ── Tab: Takip Paneli ── */}
      {tab === "takip" && (
        <div className="space-y-10">
          <p className="text-xs text-warm-400">Takip ettiğiniz yazarları ve sizi takip eden üyeleri buradan görebilirsiniz. Bir yazarı takip ettiğinizde yeni tarifleri ve yazıları sizinle öne çıkar.</p>

          {/* Takip Ettiklerim */}
          <section>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">
              Takip Ettiklerim
              <span className="ml-1.5 text-xs font-normal text-warm-400">({followingCount})</span>
            </h2>
            {followingCount === 0 ? (
              <Empty icon="👥" text="Henüz kimseyi takip etmiyorsunuz." />
            ) : (
              <>
                <div className="space-y-2">
                  {followingPag.items.map((entry, i) => {
                    if (entry.type === "admin" && adminProfile) {
                      return (
                        <div key="admin" className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3">
                          <Link href="/uye/__admin__" className="flex items-center gap-3 flex-1 min-w-0 group">
                            {adminProfile.avatar_url ? (
                              <img src={adminProfile.avatar_url} alt={(adminProfile as any).full_name || adminProfile.username}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-600 flex-shrink-0">
                                {((adminProfile as any).full_name || adminProfile.username || "H").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-warm-800 text-sm group-hover:text-brand-700 transition-colors">
                                {(adminProfile as any).full_name || adminProfile.username}
                              </p>
                              {(adminProfile as any).full_name && (
                                <p className="text-xs text-warm-400">@{adminProfile.username}</p>
                              )}
                            </div>
                          </Link>
                          <UnfollowButton isAdmin={true} />
                        </div>
                      );
                    }
                    if (entry.type === "member") {
                      return (
                        <div key={entry.followingId} className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3">
                          <Link href={`/uye/${entry.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt={entry.full_name || entry.username}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-600 flex-shrink-0">
                                {(entry.full_name || entry.username).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-warm-800 text-sm group-hover:text-brand-700 transition-colors">
                                {entry.full_name || entry.username}
                              </p>
                              {entry.full_name && <p className="text-xs text-warm-400">@{entry.username}</p>}
                            </div>
                          </Link>
                          <UnfollowButton targetUserId={entry.id} />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <Pagination tab="takip" page={followingPag.safePage} totalPages={followingPag.totalPages} />
              </>
            )}
          </section>

          {/* Takipçilerim */}
          <section>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">
              Takipçilerim
              <span className="ml-1.5 text-xs font-normal text-warm-400">({followerCount})</span>
            </h2>
            {followerCount === 0 ? (
              <Empty icon="🙋" text="Henüz takipçiniz yok." />
            ) : (
              <>
                <div className="space-y-2">
                  {followersPag.items.map((f: any) => {
                    const p = f.profiles as unknown as { id: string; username: string; full_name: string | null; avatar_url: string | null } | null;
                    if (!p) return null;
                    return (
                      <Link key={f.follower_id} href={`/uye/${p.username}`}
                        className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all group">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.full_name || p.username}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-base font-bold text-brand-600 flex-shrink-0">
                            {(p.full_name || p.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-warm-800 text-sm group-hover:text-brand-700 transition-colors">
                            {p.full_name || p.username}
                          </p>
                          {p.full_name && <p className="text-xs text-warm-400">@{p.username}</p>}
                        </div>
                        <span className="text-warm-300 group-hover:text-brand-400 transition-colors">→</span>
                      </Link>
                    );
                  })}
                </div>
                {/* Takipçiler page2 param kullanır */}
                <Pagination tab="takip" page={followersPag.safePage} totalPages={followersPag.totalPages} pageParam="page2" />
              </>
            )}
          </section>
        </div>
      )}

      {/* ── Tab: Hesap Bilgilerim ── */}
      {tab === "panelim" && (
        <div className="space-y-6">
          <p className="text-xs text-warm-400">Profil bilgilerinizi, kullanıcı adınızı ve sosyal medya bağlantılarınızı buradan güncelleyebilirsiniz. Kullanıcı adı değişikliği yalnızca bir kez yapılabilir.</p>
          <UsernameForm currentUsername={profile?.username ?? ""} changeCount={profile?.username_change_count ?? 0} />
          <ProfileForm profile={{
            full_name: profile?.full_name ?? null,
            bio:       profile?.bio       ?? null,
            instagram: profile?.instagram ?? null,
            twitter:   profile?.twitter   ?? null,
            youtube:   profile?.youtube   ?? null,
            website:   profile?.website   ?? null,
          }} />
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-12 text-center text-warm-400">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Pagination({
  tab, page, totalPages, pageParam = "page",
}: {
  tab: string; page: number; totalPages: number; pageParam?: string;
}) {
  if (totalPages <= 1) return null;
  const base = `/uye/panel?tab=${tab}`;
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      {page > 1 && (
        <Link href={`${base}&${pageParam}=${page - 1}`}
          className="px-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-600 hover:bg-warm-50 transition-colors">
          ← Önceki
        </Link>
      )}
      <span className="text-sm text-warm-400">{page} / {totalPages}</span>
      {page < totalPages && (
        <Link href={`${base}&${pageParam}=${page + 1}`}
          className="px-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-600 hover:bg-warm-50 transition-colors">
          Sonraki →
        </Link>
      )}
    </div>
  );
}
