import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "./AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap / Kayıt Ol",
};

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; tab?: string }>;
}) {
  const { from, tab } = await searchParams;

  // Already logged in → redirect
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(from ?? "/uye/panel");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍽️</div>
          <h1 className="text-2xl font-bold text-warm-800">Menü Günlüğü</h1>
          <p className="text-warm-500 text-sm mt-1">
            Tarifleri keşfet, yorum yap, favorilerini kaydet
          </p>
        </div>

        <AuthForm defaultTab={tab === "kayit" ? "kayit" : "giris"} from={from} />
      </div>
    </div>
  );
}
