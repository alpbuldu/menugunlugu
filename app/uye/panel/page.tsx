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

const FAV_PAGE_SIZE = 12;

interface Props { searchParams: Promise<{ tab?: string; page?: string }> }

export default async function UyePanelPage({ searchParams }: Props) {
  const { tab = "tariflerim", page = "1" } = await searchParams;
  const favPage = Math.max(1, parseInt(page));

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

  const followingCount = (following?.length ?? 0) + (followsAdmin ? 1 : 0);

  // Tarif Defterim pagination
  const favTotal      = favorites?.length ?? 0;
  const favTotalPages = Math.max(1, Math.ceil(favTotal / FAV_PAGE_SIZE));
  const favSafePage   = Math.min(favPage, favTotalPages);
  const paginatedFavs = (favorites ?? []).slice((favSafePage - 1) * FAV_PAGE_SIZE, favSafePage * FAV_PAGE_SIZE);

  const tabs = [
    { key: "tariflerim",     label: "Tariflerim",       short: "Tariflerim",  count: recipes?.length ?? 0 },
    { key: "tarif-defterim", label: "Tarif Defterim",   short: "Defterim",    count: favTotal },
    { key: "yazilarim",      label: "Yazılarım",        short: "Yazılarım",   count: posts?.length ?? 0 },
    { key: "takip",          label: "Takip Paneli",     short: "Takip",       count: followingCount + (followers?.length ?? 0) },
    { key: "panelim",        label: "Hesap Bilgilerim", short: "Hesabım",     count: null },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Profil başlık ── */}
      <div className="mb-8">
        {/* Mobil: profil üstte, butonlar altta. Desktop: yan yana */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

          {/* Avatar + isim */}
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

          {/* Aksiyon butonları: mobilde tam genişlik satır */}
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

      {/* ── Tab navigation ──
          Mobil: flex-wrap ile 3+2 grid (min-w-[30%] → 3/satır → son 2 flex-grow ile 50/50)
          Desktop: tek satır yatay scroll
      */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 mb-8 bg-warm-100 p-1 rounded-2xl sm:overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t.key} href={`/uye/panel?tab=${t.key}`}
            className={[
              "flex-1 min-w-[30%] sm:min-w-0 sm:flex-shrink-0 flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center",
              tab === t.key
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700",
            ].join(" ")}>
            {/* Kısa etiket mobilde, tam etiket masaüstünde */}
            <span className="sm:hidden leading-tight">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warm-500">{recipes?.length ?? 0} tarif</p>
            <Link href="/tarif-ekle" className="text-sm text-brand-600 hover:underline">+ Yeni tarif ekle</Link>
          </div>
          {!recipes || recipes.length === 0 ? (
            <Empty icon="📝" text="Henüz tarif eklemediniz." />
          ) : (
            (recipes as (Recipe & { approval_status: string; created_at: string })[]).map((r) => {
              const s = statusLabel[r.approval_status] ?? statusLabel["pending"];
              return (
                <div key={r.id} className="bg-white rounded-xl border border-warm-200 overflow-hidden">
                  {/* Üst satır: görsel + başlık + durum */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {r.image_url ? (
                      <Image src={r.image_url} alt={r.title} width={48} height={48}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-800 text-sm truncate">{r.title}</p>
                      <p className="text-xs text-warm-400">
                        {CATEGORY_LABELS[r.category]} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  {/* Alt şerit: aksiyonlar */}
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-warm-100 bg-warm-50/60">
                    <Link href={`/tarif-duzenle/${r.id}`}
                      className="text-xs text-warm-500 hover:text-brand-600 transition-colors">
                      Düzenle
                    </Link>
                    {r.approval_status === "approved" && (
                      <Link href={`/recipes/${r.slug}`}
                        className="text-xs text-brand-600 hover:underline">
                        Görüntüle
                      </Link>
                    )}
                    <div className="ml-auto">
                      <DeleteRecipeButton recipeId={r.id} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ── Tab: Tarif Defterim (sayfalama: 12/sayfa) ── */}
      {tab === "tarif-defterim" && (
        <section>
          <p className="text-sm text-warm-500 mb-4">{favTotal} tarif kaydedildi</p>
          {favTotal === 0 ? (
            <Empty icon="📚" text="Tarif defteriniz boş. Tarifleri incelerken ❤️ butona basın." />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {paginatedFavs.map((fav) => {
                  const r = fav.recipes as unknown as (Recipe & { submitted_by?: string | null }) | null;
                  if (!r) return null;
                  const favAuthor: { username: string; avatar_url: string | null } | null = r.submitted_by
                    ? (favProfileMap[r.submitted_by] ?? null)
                    : { username: adminUsername, avatar_url: adminAvatarUrl };
                  return (
                    <Link key={fav.recipe_id} href={`/recipes/${r.slug}`}
                      className="group bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                      {r.image_url ? (
                        <Image src={r.image_url} alt={r.title} width={200} height={120}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-28 bg-warm-100 flex items-center justify-center text-2xl">🍽️</div>
                      )}
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-sm font-medium text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">{r.title}</p>
                        <p className="text-xs text-warm-400 mt-1 mb-auto">{CATEGORY_LABELS[r.category]}</p>
                        {favAuthor && (
                          <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-warm-100">
                            {favAuthor.avatar_url ? (
                              <img src={favAuthor.avatar_url} alt={favAuthor.username}
                                className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {favAuthor.username.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="text-[10px] text-warm-400 truncate">{favAuthor.username}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Sayfalama */}
              {favTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  {favSafePage > 1 && (
                    <Link href={`/uye/panel?tab=tarif-defterim&page=${favSafePage - 1}`}
                      className="px-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-600 hover:bg-warm-50 transition-colors">
                      ← Önceki
                    </Link>
                  )}
                  <span className="text-sm text-warm-400">{favSafePage} / {favTotalPages}</span>
                  {favSafePage < favTotalPages && (
                    <Link href={`/uye/panel?tab=tarif-defterim&page=${favSafePage + 1}`}
                      className="px-4 py-2 rounded-xl border border-warm-200 text-sm text-warm-600 hover:bg-warm-50 transition-colors">
                      Sonraki →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Tab: Yazılarım ── */}
      {tab === "yazilarim" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-warm-500">{posts?.length ?? 0} yazı</p>
            <Link href="/yazi-ekle" className="text-sm text-brand-600 hover:underline">+ Yeni yazı ekle</Link>
          </div>
          {!posts || posts.length === 0 ? (
            <Empty icon="✍️" text="Henüz yazı paylaşmadınız." />
          ) : (
            posts.map((p) => {
              const s = statusLabel[p.approval_status] ?? statusLabel["pending"];
              return (
                <div key={p.id} className="bg-white rounded-xl border border-warm-200 overflow-hidden">
                  {/* Üst satır: ikon + başlık + durum */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 text-lg">✍️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-800 text-sm truncate">{p.title}</p>
                      <p className="text-xs text-warm-400">{formatDate(p.created_at)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  {/* Alt şerit: aksiyonlar */}
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-warm-100 bg-warm-50/60">
                    <Link href={`/yazi-duzenle/${p.id}`}
                      className="text-xs text-warm-500 hover:text-brand-600 transition-colors">
                      Düzenle
                    </Link>
                    {p.approval_status === "approved" && (
                      <Link href={`/yazi/${p.slug}`}
                        className="text-xs text-brand-600 hover:underline">
                        Görüntüle
                      </Link>
                    )}
                    <div className="ml-auto">
                      <DeletePostButton postId={p.id} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ── Tab: Takip Paneli ── */}
      {tab === "takip" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">
              Takip Ettiklerim
              <span className="ml-1.5 text-xs font-normal text-warm-400">({followingCount})</span>
            </h2>
            {followingCount === 0 ? (
              <Empty icon="👥" text="Henüz kimseyi takip etmiyorsunuz." />
            ) : (
              <div className="space-y-2">
                {followsAdmin && adminProfile && (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3">
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
                )}
                {following?.map((f) => {
                  const p = f.profiles as unknown as { id: string; username: string; full_name: string | null; avatar_url: string | null } | null;
                  if (!p) return null;
                  return (
                    <div key={f.following_id} className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3">
                      <Link href={`/uye/${p.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
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
                      </Link>
                      <UnfollowButton targetUserId={p.id} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-warm-700 mb-3">
              Takipçilerim
              <span className="ml-1.5 text-xs font-normal text-warm-400">({followers?.length ?? 0})</span>
            </h2>
            {!followers || followers.length === 0 ? (
              <Empty icon="🙋" text="Henüz takipçiniz yok." />
            ) : (
              <div className="space-y-2">
                {followers.map((f) => {
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
            )}
          </section>
        </div>
      )}

      {/* ── Tab: Hesap Bilgilerim ── */}
      {tab === "panelim" && (
        <div className="space-y-6">
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
