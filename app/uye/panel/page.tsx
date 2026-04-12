import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import type { Recipe } from "@/lib/types";
import UsernameForm from "./UsernameForm";
import ProfileForm from "./ProfileForm";

export const metadata: Metadata = { title: "Üye Paneli" };

export default async function UyePanelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio, full_name, instagram, twitter, youtube, website")
    .eq("id", user.id)
    .single();

  // Fetch user's submitted recipes
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url, approval_status, created_at")
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  // Fetch favorites
  const { data: favorites } = await supabase
    .from("favorites")
    .select("recipe_id, recipes(id, title, slug, category, image_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const statusLabel: Record<string, { label: string; cls: string }> = {
    pending:  { label: "İncelemede", cls: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Yayında",    cls: "bg-green-100 text-green-700"  },
    rejected: { label: "Reddedildi", cls: "bg-red-100 text-red-700"      },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    soup: "Çorba", main: "Ana Yemek", side: "Yardımcı Lezzet", dessert: "Tatlı",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* ── Profile header ── */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-brand-200">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="Profil" width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-warm-800">
            {profile?.username ?? user.email}
          </h1>
          <p className="text-sm text-warm-500">
            {user.email}
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <Link
            href="/tarif-ekle"
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
          >
            + Tarif Ekle
          </Link>
          <form action="/api/auth/member-logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-warm-200 hover:bg-warm-100 text-warm-600 text-sm font-medium transition-colors"
            >
              Çıkış
            </button>
          </form>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tarif",   value: recipes?.length ?? 0 },
          { label: "Favori",  value: favorites?.length ?? 0 },
          { label: "Yorum",   value: 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-warm-200 p-4 text-center">
            <div className="text-2xl font-bold text-warm-800">{s.value}</div>
            <div className="text-xs text-warm-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Username change ── */}
      <UsernameForm currentUsername={profile?.username ?? ""} />

      {/* ── Profile info ── */}
      <ProfileForm profile={{
        full_name: profile?.full_name ?? null,
        bio:       profile?.bio       ?? null,
        instagram: profile?.instagram ?? null,
        twitter:   profile?.twitter   ?? null,
        youtube:   profile?.youtube   ?? null,
        website:   profile?.website   ?? null,
      }} />

      {/* ── My recipes ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-warm-800">Tariflerim</h2>
          <Link
            href="/tarif-ekle"
            className="text-sm text-brand-600 hover:underline"
          >
            + Yeni tarif ekle
          </Link>
        </div>

        {!recipes || recipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-200 p-8 text-center text-warm-400">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-sm">Henüz tarif eklemediniz.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(recipes as (Recipe & { approval_status: string })[]).map((r) => {
              const s = statusLabel[r.approval_status] ?? statusLabel["pending"];
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-warm-200 px-4 py-3"
                >
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.title} width={48} height={48} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-warm-100 flex items-center justify-center flex-shrink-0 text-xl">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-800 text-sm truncate">{r.title}</p>
                    <p className="text-xs text-warm-400">{CATEGORY_LABELS[r.category]}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${s.cls}`}>
                    {s.label}
                  </span>
                  {r.approval_status === "approved" && (
                    <Link href={`/recipes/${r.slug}`} className="text-xs text-brand-600 hover:underline flex-shrink-0">
                      Görüntüle
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Favorites ── */}
      <section>
        <h2 className="text-lg font-bold text-warm-800 mb-4">Tarif Defterim</h2>
        {!favorites || favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-200 p-8 text-center text-warm-400">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm">Favori tarifiniz yok. Tarifleri incelerken ❤️ butona basın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {favorites.map((fav) => {
              const r = fav.recipes as unknown as Recipe | null;
              if (!r) return null;
              return (
                <Link
                  key={fav.recipe_id}
                  href={`/recipes/${r.slug}`}
                  className="group bg-white rounded-xl border border-warm-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {r.image_url ? (
                    <Image src={r.image_url} alt={r.title} width={200} height={120} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-warm-100 flex items-center justify-center text-2xl">🍽️</div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-warm-800 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </p>
                    <p className="text-xs text-warm-400 mt-1">{CATEGORY_LABELS[r.category]}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
