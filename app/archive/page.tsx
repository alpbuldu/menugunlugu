import type { Metadata } from "next";
import Link from "next/link";
import Calendar from "@/components/archive/Calendar";
import SidebarLayout from "@/components/ui/SidebarLayout";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dünün Menüsü",
  description: "Geçmiş günlerin menülerini takvimden seçerek inceleyin.",
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
    <SidebarLayout placement="sidebar_archive">
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <h1 className="text-3xl font-bold text-warm-900 mb-1">Dünün Menüsü</h1>
      <p className="text-sm sm:text-base text-warm-500 mb-4 sm:mb-10">
        Geçmiş günlerin menülerini takvimden seçerek inceleyin.
      </p>
      <Calendar />

      {/* Yatay banner — sadece aktifken render edilir */}
      {archiveBanner && (
        <div className="mt-6 sm:mt-8 relative">
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
      )}

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
    </SidebarLayout>
  );
}
