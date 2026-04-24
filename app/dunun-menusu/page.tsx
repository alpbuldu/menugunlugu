import type { Metadata } from "next";
import Link from "next/link";
import Calendar from "@/components/archive/Calendar";
import { createAdminClient } from "@/lib/supabase/server";
import AdSenseUnit from "@/components/ui/AdSenseUnit";

export const revalidate = 1800; // 30 dakikada bir yenile

export const metadata: Metadata = {
  title: "Dünün Menüsü",
  description: "Geçmiş günlerin menülerini takvimden seçerek inceleyin.",
  alternates: { canonical: "/dunun-menusu" },
};

export default async function ArchivePage() {
  const supabase = createAdminClient();
  const { data: archiveBanner } = await supabase
    .from("ads")
    .select("image_url, link_url, title")
    .eq("placement", "archive_banner")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Dünün Menüsü</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4">
        Geçmiş günlerin menülerini takvimden seçerek inceleyin.
      </p>

      {/* Yatay banner — açıklama altında, takvim üstünde */}
      {archiveBanner ? (
        <div className="mb-6 sm:mb-8 relative">
          <p className="absolute -top-4 right-0 text-[10px] text-warm-300 tracking-wide">Reklam</p>
          <a
            href={archiveBanner.link_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block rounded-xl overflow-hidden border border-warm-100 hover:opacity-90 transition-opacity"
          >
            <img
              src={archiveBanner.image_url}
              alt={archiveBanner.title ?? "Reklam"}
              className="w-full h-[70px] sm:h-[100px] object-cover"
            />
          </a>
        </div>
      ) : (
        <>
          <AdSenseUnit slot="dunun_menusu_yatay" width="100%" height="70px" className="block sm:hidden mb-6" />
          <AdSenseUnit slot="dunun_menusu_yatay" width="100%" height="100px" className="hidden sm:block mb-8" />
        </>
      )}

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
    </div>
  );
}
