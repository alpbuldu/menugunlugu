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
  searchParams: Promise<{ from?: string; tab?: string; mesaj?: string; new?: string; deleted?: string }>;
}) {
  const { from: rawFrom, tab, mesaj, new: isNew, deleted } = await searchParams;
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

        <AuthForm
          defaultTab={tab === "kayit" ? "kayit" : tab === "sifre" ? "sifre" : "giris"}
          from={from}
          isNewAccount={isNew === "1"}
          topMesaj={
            mesaj === "email-onaylandi" ? "email-onaylandi"
            : mesaj === "onay-hatasi"  ? "onay-hatasi"
            : deleted === "1"          ? "deleted"
            : null
          }
        />
      </div>
    </div>
  );
}
