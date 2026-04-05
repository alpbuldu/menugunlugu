import Link from "next/link";
import type { Metadata } from "next";
import { adminGetAllMenus } from "@/lib/supabase/admin-queries";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata: Metadata = { title: "Menüler" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Yayında", cls: "bg-green-100 text-green-700" },
  draft:     { label: "Taslak",  cls: "bg-warm-100 text-warm-500"  },
};

export default async function AdminMenusPage() {
  const menus = await adminGetAllMenus();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Menüler</h1>
          <p className="text-sm text-warm-400 mt-0.5">{menus.length} menü</p>
        </div>
        <Link
          href="/admin/menus/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          + Yeni Menü
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-warm-600 font-medium mb-1">Henüz menü eklenmemiş</p>
          <p className="text-sm text-warm-400 mb-6">İlk günlük menünüzü oluşturun</p>
          <Link
            href="/admin/menus/new"
            className="inline-flex px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Menü Oluştur
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-50 border-b border-warm-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden md:table-cell">
                  Yemekler
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-warm-500 uppercase tracking-wider hidden sm:table-cell">
                  Durum
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-warm-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-50">
              {menus.map((menu) => {
                const st = STATUS_LABELS[menu.status] ?? STATUS_LABELS.draft;
                return (
                  <tr key={menu.id} className="hover:bg-warm-50/50 transition-colors">
                    {/* Date */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-warm-800">
                        {new Date(menu.date + "T12:00:00").toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Courses summary */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-warm-600">
                        <span>🍲 {menu.soup.title}</span>
                        <span>🍽️ {menu.main.title}</span>
                        <span>🥗 {menu.side.title}</span>
                        <span>🍮 {menu.dessert.title}</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/admin/menus/${menu.id}/edit`}
                          className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors"
                        >
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
    </div>
  );
}
