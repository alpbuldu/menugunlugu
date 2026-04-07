import type { Metadata } from "next";
import { adminGetAllMenus } from "@/lib/supabase/admin-queries";
import BulkMenuDeleteForm from "@/components/admin/BulkMenuDeleteForm";

export const metadata: Metadata = { title: "Toplu Menü Sil" };
export const dynamic = "force-dynamic";

export default async function BulkMenuDeletePage() {
  const menus = await adminGetAllMenus();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Toplu Menü Sil</h1>
        <p className="text-sm text-warm-500 mt-1">
          Silmek istediğin menüleri işaretle ve onayla. Bu işlem geri alınamaz.
        </p>
      </div>

      <BulkMenuDeleteForm menus={menus} />
    </div>
  );
}
