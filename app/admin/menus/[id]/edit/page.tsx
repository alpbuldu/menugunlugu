import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { adminGetMenuById, adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import MenuForm from "@/components/admin/MenuForm";

export const metadata: Metadata = { title: "Menüyü Düzenle" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditMenuPage({ params }: Props) {
  const { id } = await params;

  const [menu, recipes] = await Promise.all([
    adminGetMenuById(id),
    adminGetAllRecipes(),
  ]);

  if (!menu) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/menus"
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
        >
          ← Menüler
        </Link>
        <span className="text-warm-200">/</span>
        <h1 className="text-2xl font-bold text-warm-900">Menüyü Düzenle</h1>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
        <MenuForm recipes={recipes} menu={menu} />
      </div>
    </div>
  );
}
