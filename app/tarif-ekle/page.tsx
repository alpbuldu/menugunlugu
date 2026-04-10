import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecipeSubmitForm from "./RecipeSubmitForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tarif Ekle" };

export default async function TarifEklePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris?from=/tarif-ekle");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Tarif Ekle</h1>
        <p className="text-warm-500 text-sm mt-1">
          Tarifini paylaş, incelendikten sonra yayına alınsın.
        </p>
      </div>

      <RecipeSubmitForm />
    </div>
  );
}
