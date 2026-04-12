import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import DeleteButton from "@/components/admin/DeleteButton";
import Badge from "@/components/ui/Badge";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Tarifler" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all",     label: "Tümü" },
  { key: "soup",    label: "Çorba" },
  { key: "main",    label: "Ana Yemek" },
  { key: "side",    label: "Yardımcı Lezzet" },
  { key: "dessert", label: "Tatlı" },
];

interface Props {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function AdminRecipesPage({ searchParams }: Props) {
  const { q = "", category = "all", page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const all = await adminGetAllRecipes();

  // Filtrele
  const filtered = all.filter((r) => {
    const matchCat    = category === "all" || r.category === category;
    const matchSearch = !q.trim() || r.title.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const recipes    = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function href(overrides: { q?: string; category?: string; page?: number }) {
    const p = new URLSearchParams();
    const search = "q"        in overrides ? overrides.q        : q;
    const cat    = "category" in overrides ? overrides.category : category;
    const pg     = overrides.page ?? currentPage;
    if (search) p.set("q", search);
    if (cat && cat !== "all") p.set("category", cat);
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/admin/recipes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Tarifler</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            {filtered.length === all.length
              ? `${all.length} tarif`
              : `${filtered.length} / ${all.length} tarif`}
          </p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Yeni Tarif
        </Link>
      </div>

      {/* Arama + kategori filtresi */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form method="GET" action="/admin/recipes" className="flex-1 min-w-[200px]">
          {category !== "all" && <input type="hidden" name="category" value={category} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tarif adında ara…"
            className="w-full px-4 py-2 border border-warm-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={href({ category: cat.key, page: 1 })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                category === cat.key
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Liste */}
      {recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-warm-600 font-medium mb-1">
            {all.length === 0 ? "Henüz tarif eklenmemiş" : "Sonuç bulunamadı"}
          </p>
          {(q || category !== "all") && (
            <Link href="/admin/recipes" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
              Filtreyi temizle
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Tarif</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Yazan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden lg:table-cell">Son Güncelleme</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {recipes.map((recipe) => {
                const hasImage = recipe.image_url && recipe.image_url.trim();
                return (
                  <tr key={recipe.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-warm-100 shrink-0">
                          {hasImage ? (
                            <Image src={recipe.image_url!} alt={recipe.title} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-lg text-warm-300">🍽️</div>
                          )}
                        </div>
                        <span className="font-medium text-warm-800">{recipe.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge category={recipe.category as Category} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-warm-500 whitespace-nowrap">
                      {(recipe as any).profiles?.username
                        ? <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium">@{(recipe as any).profiles.username}</span>
                        : <span className="text-warm-300">admin</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-warm-400 whitespace-nowrap">
                      {new Date(recipe.updated_at ?? recipe.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link href={`/admin/recipes/${recipe.id}/edit`} className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors">
                          Düzenle
                        </Link>
                        <DeleteButton
                          endpoint={`/api/recipes/${recipe.id}`}
                          label={`"${recipe.title}" tarifini silmek istediğinizden emin misiniz?`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
          {currentPage > 1 ? (
            <Link href={href({ page: currentPage - 1 })} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors">‹</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">‹</span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = p === currentPage;
            const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
            const ellipsisBefore = p === currentPage - 2 && currentPage - 2 > 1;
            const ellipsisAfter  = p === currentPage + 2 && currentPage + 2 < totalPages;
            if (!show) return null;
            return (
              <span key={p} className="flex items-center gap-1.5">
                {ellipsisBefore && <span className="text-warm-400 text-sm px-1">…</span>}
                <Link
                  href={href({ page: p })}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                    isCurrent ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  {p}
                </Link>
                {ellipsisAfter && <span className="text-warm-400 text-sm px-1">…</span>}
              </span>
            );
          })}

          {currentPage < totalPages ? (
            <Link href={href({ page: currentPage + 1 })} className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white text-warm-600 text-sm hover:border-brand-300 hover:text-brand-600 transition-colors">›</Link>
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-warm-100 text-warm-300 text-sm cursor-default">›</span>
          )}
        </div>
      )}
    </div>
  );
}
