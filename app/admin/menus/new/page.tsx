import type { Metadata } from "next";
import Link from "next/link";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import MenuForm from "@/components/admin/MenuForm";

export const metadata: Metadata = { title: "Yeni Menü" };
export const dynamic = "force-dynamic";

export default async function NewMenuPage() {
  const recipes = await adminGetAllRecipes();

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
        <h1 className="text-2xl font-bold text-warm-900">Yeni Menü Oluştur</h1>
      </div>

      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
        <MenuForm recipes={recipes} />
      </div>
    </div>
  );
}
