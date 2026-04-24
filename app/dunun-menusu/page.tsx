import type { Metadata } from "next";
import Link from "next/link";
import Calendar from "@/components/archive/Calendar";
import AdSlot from "@/components/ui/AdSlot";
import PagePopup from "@/components/ui/PagePopup";

export const revalidate = 1800; // 30 dakikada bir yenile

export const metadata: Metadata = {
  title: "Dünün Menüsü",
  description: "Geçmiş günlerin menülerini takvimden seçerek inceleyin.",
  alternates: { canonical: "/dunun-menusu" },
};

export default async function ArchivePage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Dünün Menüsü</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4">
        Geçmiş günlerin menülerini takvimden seçerek inceleyin.
      </p>

      {/* Yatay banner — açıklama altında, takvim üstünde */}
      <AdSlot placement="archive_banner" adSenseSlot="dunun_menusu_yatay"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="block sm:hidden mb-6" />
      <AdSlot placement="archive_banner" adSenseSlot="dunun_menusu_yatay"
        imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="hidden sm:block mb-8" />

      <Calendar />

      {/* CTA */}
      <div className="mt-6 sm:mt-8 sm:text-center">
        <Link
          href="/recipes"
          className="flex sm:inline-flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium text-sm transition-colors border border-warm-200 rounded-xl px-4 py-3 hover:bg-warm-50"
        >
          Tüm tarifleri gör →
        </Link>
      </div>
      <PagePopup page="dunun_menusu" />
    </div>
  );
}
