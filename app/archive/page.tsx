import type { Metadata } from "next";
import Link from "next/link";
import Calendar from "@/components/archive/Calendar";

export const metadata: Metadata = {
  title: "Dünün Menüsü",
  description: "Geçmiş günlerin menülerini takvimden seçerek inceleyin.",
};

export default function ArchivePage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Dünün Menüsü</h1>
      <p className="text-warm-500 mb-10">
        Geçmiş günlerin menülerini takvimden seçerek inceleyin.
      </p>
      <Calendar />

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors"
        >
          Tüm tarifleri gör →
        </Link>
      </div>
    </div>
  );
}
