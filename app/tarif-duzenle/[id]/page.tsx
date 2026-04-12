import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RecipeEditForm from "./RecipeEditForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TarifDuzenle({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, title, category, servings, description, ingredients, instructions, image_url, approval_status, submitted_by")
    .eq("id", id)
    .single();

  if (!recipe) notFound();
  if (recipe.submitted_by !== user.id) notFound(); // sadece kendi tarifini düzenleyebilir

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-warm-900 mb-2">Tarifi Düzenle</h1>
      <p className="text-sm text-warm-500 mb-8">
        Değişiklikler kaydedilince tarif tekrar incelemeye alınacak.
      </p>
      <RecipeEditForm recipe={recipe} />
    </div>
  );
}
