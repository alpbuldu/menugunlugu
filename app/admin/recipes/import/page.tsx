import Link from "next/link";
import type { Metadata } from "next";
import BulkImportForm from "@/components/admin/BulkImportForm";

export const metadata: Metadata = { title: "Toplu Tarif İçe Aktar" };

export default function BulkImportPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/recipes" className="text-sm text-warm-400 hover:text-warm-700 transition-colors">
          ← Tarifler
        </Link>
        <h1 className="text-2xl font-bold text-warm-900 mt-2">Toplu Tarif İçe Aktar</h1>
        <p className="text-sm text-warm-400 mt-1">Excel veya Google Sheets'ten yapıştırarak toplu tarif ekle</p>
      </div>
      <BulkImportForm />
    </div>
  );
}
