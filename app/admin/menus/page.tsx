import Link from "next/link";
import type { Metadata } from "next";
import { adminGetAllMenus } from "@/lib/supabase/admin-queries";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata: Metadata = { title: "Menüler" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Yayında", cls: "bg-green-100 text-green-700" },
  draft:     { label: "Taslak",  cls: "bg-warm-100 text-warm-500"  },
};

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminMenusPage({ searchParams }: Props) {
  const { status = "all", page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const all = await adminGetAllMenus();

  const filtered = status === "all"
    ? all
    : all.filter((m) => m.status === status);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const menus      = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function href(overrides: { status?: string; page?: number }) {
    const p  = new URLSearchParams();
    const st = "status" in overrides ? overrides.status : status;
    const pg = overrides.page ?? currentPage;
    if (st && st !== "all") p.set("status", st);
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/admin/menus${qs ? `?${qs}` : ""}`;
  }

  const FILTER_BTNS = [
    { key: "all",       label: "Tümü" },
    { key: "published", label: "Yayında" },
    { key: "draft",     label: "Taslak" },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Menüler</h1>
          <p className="text-sm text-warm-400 mt-0.5">
            {filtered.length === all.length
              ? `${all.length} menü`
              : `${filtered.length} / ${all.length} menü`}
          </p>
        </div>
        <Link
          href="/admin/menus/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Yeni Menü
        </Link>
      </div>

      {/* Durum filtresi */}
      <div className="flex gap-2 mb-6">
        {FILTER_BTNS.map((btn) => (
          <Link
            key={btn.key}
            href={href({ status: btn.key, page: 1 })}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              status === btn.key
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-warm-200 text-warm-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {btn.label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      {menus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-warm-600 font-medium mb-1">
            {all.length === 0 ? "Henüz menü eklenmemiş" : "Bu filtrede menü yok"}
          </p>
          {status !== "all" && (
            <Link href="/admin/menus" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
              Filtreyi temizle
            </Link>
          )}
          {all.length === 0 && (
            <Link href="/admin/menus/new" className="mt-4 inline-flex px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
              Menü Oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">Yemekler</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">Durum</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {menus.map((menu) => {
                const st = STATUS_LABELS[menu.status] ?? STATUS_LABELS.draft;
                return (
                  <tr key={menu.id} className="hover:bg-warm-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-warm-800">
                        {new Date(menu.date + "T12:00:00").toLocaleDateString("tr-TR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-warm-600">
                        <span>🍲 {menu.soup.title}</span>
                        <span>🍽️ {menu.main.title}</span>
                        <span>🥗 {menu.side.title}</span>
                        <span>🍮 {menu.dessert.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link href={`/admin/menus/${menu.id}/edit`} className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors">
                          Düzenle
                        </Link>
                        <DeleteButton
                          endpoint={`/api/menu/${menu.id}`}
                          label={`${new Date(menu.date + "T12:00:00").toLocaleDateString("tr-TR")} tarihli menüyü silmek istediğinizden emin misiniz?`}
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
