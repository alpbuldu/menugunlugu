import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Recipe } from "@/lib/types";
import UsernameForm from "./UsernameForm";
import ProfileForm from "./ProfileForm";

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

interface Props { searchParams: Promise<{ tab?: string }> }

export default async function UyePanelPage({ searchParams }: Props) {
  const { tab = "tariflerim" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, full_name, instagram, twitter, youtube, website")
    .eq("id", user.id)
    .single();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, approval_status, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  const { data: favorites } = await supabase
    .from("favorites")
    .select("recipe_id, created_at, recipes(id, title, slug, category, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, created_at, recipes(id, title, slug, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tabs = [
    { key: "tariflerim",   label: "Tariflerim",    count: recipes?.length ?? 0 },
    { key: "tarif-defterim", label: "Tarif Defterim", count: favorites?.length ?? 0 },
    { key: "yorumlarim",   label: "Yorumlarım",    count: comments?.length ?? 0 },
    { key: "panelim",      label: "Panelim",       count: null },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Profil başlık ── */}
      <div className="flex items-center gap-4 mb-8">
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
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/tarif-ekle"
            className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
            + Tarif Ekle
          </Link>
          <form action="/api/auth/member-logout" method="POST">
            <button type="submit"
              className="px-3 py-2 rounded-xl border border-warm-200 hover:bg-warm-100 text-warm-600 text-sm font-medium transition-colors">
              Çıkış
            </button>
          </form>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="flex gap-1 mb-8 bg-warm-100 p-1 rounded-2xl">
        {tabs.map((t) => (
          <Link key={t.key} href={`/uye/panel?tab=${t.key}`}
            className={[
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
              tab === t.key
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700",
            ].join(" ")}>
            {t.label}
            {t.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-brand-100 text-brand-600" : "bg-warm-200 text-warm-500"
              }`}>{t.count}</span>
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
            (recipes as (Recipe & { approval_status: string })[]).map((r) => {
              const s = statusLabel[r.approval_status] ?? statusLabel["pending"];
              return (
                <div key={r.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3">
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.title} width={48} height={48}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-800 text-sm truncate">{r.title}</p>
                    <p className="text-xs text-warm-400">{CATEGORY_LABELS[r.category]}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>{s.label}</span>
                  <Link href={`/tarif-duzenle/${r.id}`}
                    className="text-xs text-warm-400 hover:text-brand-600 hover:underline flex-shrink-0">Düzenle</Link>
                  {r.approval_status === "approved" && (
                    <Link href={`/recipes/${r.slug}`}
                      className="text-xs text-brand-600 hover:underline flex-shrink-0">Görüntüle</Link>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ── Tab: Tarif Defterim ── */}
      {tab === "tarif-defterim" && (
        <section>
          <p className="text-sm text-warm-500 mb-4">{favorites?.length ?? 0} tarif kaydedildi</p>
          {!favorites || favorites.length === 0 ? (
            <Empty icon="📚" text="Tarif defteriniz boş. Tarifleri incelerken ❤️ butona basın." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favorites.map((fav) => {
                const r = fav.recipes as unknown as Recipe | null;
                if (!r) return null;
                return (
                  <Link key={fav.recipe_id} href={`/recipes/${r.slug}`}
                    className="group bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-all">
                    {r.image_url ? (
                      <Image src={r.image_url} alt={r.title} width={200} height={120}
                        className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-28 bg-warm-100 flex items-center justify-center text-2xl">🍽️</div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-medium text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">{r.title}</p>
                      <p className="text-xs text-warm-400 mt-1">{CATEGORY_LABELS[r.category]}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Yorumlarım ── */}
      {tab === "yorumlarim" && (
        <section className="space-y-3">
          <p className="text-sm text-warm-500 mb-2">{comments?.length ?? 0} yorum</p>
          {!comments || comments.length === 0 ? (
            <Empty icon="💬" text="Henüz yorum yapmadınız." />
          ) : (
            comments.map((c) => {
              const r = c.recipes as unknown as { id: string; title: string; slug: string; image_url: string | null } | null;
              return (
                <div key={c.id} className="bg-white rounded-xl border border-warm-200 p-4">
                  {r && (
                    <Link href={`/recipes/${r.slug}`}
                      className="flex items-center gap-2 mb-2 group">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center text-sm flex-shrink-0">🍽️</div>
                      )}
                      <span className="text-xs font-semibold text-brand-600 group-hover:underline truncate">{r.title}</span>
                    </Link>
                  )}
                  <p className="text-sm text-warm-700 leading-relaxed">{c.content}</p>
                  <p className="text-xs text-warm-400 mt-2">
                    {new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* ── Tab: Panelim (Profil ayarları) ── */}
      {tab === "panelim" && (
        <div className="space-y-6">
          <UsernameForm currentUsername={profile?.username ?? ""} />
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
