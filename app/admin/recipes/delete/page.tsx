import Link from "next/link";
import type { Metadata } from "next";
import { adminGetAllRecipes } from "@/lib/supabase/admin-queries";
import BulkDeleteForm from "@/components/admin/BulkDeleteForm";

export const metadata: Metadata = { title: "Toplu Tarif Sil" };
export const dynamic = "force-dynamic";

export default async function BulkDeletePage() {
  const recipes = await adminGetAllRecipes();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/recipes" className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
          ← Tarifler
        </Link>
        <h1 className="text-2xl font-bold text-warm-900 mt-2">Toplu Tarif Sil</h1>
        <p className="text-sm text-warm-400 mt-1">
          Silmek istediğin tarifleri seç ve "Sil" butonuna bas.
        </p>
      </div>

      <BulkDeleteForm recipes={recipes} />
    </div>
  );
}
