import type { Metadata } from "next";
import Link from "next/link";
import Calendar from "@/components/archive/Calendar";
import AdBanner from "@/components/ui/AdBanner";
import SidebarLayout from "@/components/ui/SidebarLayout";

export const metadata: Metadata = {
  title: "Dünün Menüsü",
  description: "Geçmiş günlerin menülerini takvimden seçerek inceleyin.",
};

export default function ArchivePage() {
  return (
    <SidebarLayout>
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Dünün Menüsü</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4 sm:mb-10">
        Geçmiş günlerin menülerini takvimden seçerek inceleyin.
      </p>
      <Calendar />

      <AdBanner placement="archive" className="mt-6 sm:mt-10 2xl:hidden" />

      {/* CTA */}
      <div className="mt-6 sm:text-center">
        <Link
          href="/recipes"
          className="flex sm:inline-flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors border border-warm-200 rounded-xl px-4 py-3 hover:bg-warm-50"
        >
          Tüm tarifleri gör →
        </Link>
      </div>
    </div>
    </SidebarLayout>
  );
}
