import type { Metadata } from "next";
import OmuBumuGame from "@/components/ui/OmuBumuGame";

export const metadata: Metadata = {
  title: "O mu Bu mu? | Menü Günlüğü",
  description: "Kategori seç, en sevdiğin yemeği bul! Yemekler arasında 1'e 1 turnuva.",
};

const CONTAINER = "max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8";

export default function OmuBumuPage() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className={`${CONTAINER} py-8 sm:py-12`}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900">O mu Bu mu? 🤔</h1>
            <p className="text-warm-500 mt-1.5">Kategori seç, en sevdiğin yemeği bul!</p>
          </div>
          <OmuBumuGame />
        </div>
      </div>
    </div>
  );
}
