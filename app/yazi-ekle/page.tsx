import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostSubmitForm from "./PostSubmitForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Yazı Ekle" };

export default async function YaziEklePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?from=/yazi-ekle");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Yazı Ekle</h1>
        <p className="text-warm-500 text-sm mt-1">
          Düşüncelerini, ipuçlarını veya mutfak hikayelerini paylaş.
        </p>
      </div>
      <PostSubmitForm />
    </div>
  );
}
