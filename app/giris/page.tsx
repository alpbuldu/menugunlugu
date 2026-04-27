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
  searchParams: Promise<{ from?: string; tab?: string; mesaj?: string; new?: string }>;
}) {
  const { from: rawFrom, tab, mesaj, new: isNew } = await searchParams;
  // Sadece site-içi yollara izin ver
  const from = rawFrom && rawFrom.startsWith("/") && !rawFrom.startsWith("//") ? rawFrom : undefined;

  // Already logged in → redirect (email-onaylandi mesajı varsa göster, login formu kapatma)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && mesaj !== "email-onaylandi") {
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

        {mesaj === "onay-hatasi" && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            E-posta onay linki geçersiz veya süresi dolmuş. Lütfen tekrar kayıt olmayı deneyin.
          </div>
        )}

        {mesaj === "email-onaylandi" && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm text-center">
            ✅ E-posta adresiniz onaylandı! Aşağıdan giriş yapabilirsiniz.
          </div>
        )}

        <AuthForm
          defaultTab={tab === "kayit" ? "kayit" : tab === "sifre" ? "sifre" : "giris"}
          from={from}
          isNewAccount={isNew === "1"}
        />
      </div>
    </div>
  );
}
