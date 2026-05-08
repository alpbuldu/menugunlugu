import type { Metadata } from "next";
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
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-4 sm:pb-12">
      {/* Yatay banner */}
      <AdSlot placement="archive_banner" adSenseSlot="dunun_menusu_yatay"
        imageHeight="h-[70px]" adWidth="100%" adHeight="70px" className="block sm:hidden mb-6" />
      <AdSlot placement="archive_banner" adSenseSlot="dunun_menusu_yatay"
        imageHeight="h-[100px]" adWidth="100%" adHeight="100px" className="hidden sm:block mb-8" />

      <p className="text-xs sm:text-sm text-warm-500 mb-4">Geçmiş günlerin menülerini takvimden seçerek inceleyin.</p>
      <Calendar />
      <PagePopup page="dunun_menusu" />
    </div>
  );
}
