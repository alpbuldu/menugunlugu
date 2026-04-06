import type { Metadata } from "next";
import BulkMenuImportForm from "@/components/admin/BulkMenuImportForm";

export const metadata: Metadata = { title: "Toplu Menü Aktar" };

export default function BulkMenuImportPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Toplu Menü Aktar</h1>
        <p className="text-sm text-warm-500 mt-1">
          Excel&apos;den kopyalayıp yapıştırarak birden fazla günün menüsünü aynı anda ekle.
        </p>
      </div>

      <BulkMenuImportForm />
    </div>
  );
}
