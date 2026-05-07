import { redirect } from "next/navigation";
import type { Category } from "@/lib/types";

// MenuBuilder.tsx bu tipten import ediyor — backward compat için bırakıldı
export interface MenuRecipe {
  id: string;
  title: string;
  slug: string;
  category: Category;
  image_url: string | null;
  ingredients: string;
  author: string;
  kcal_per_person: number | null;
}

export default function MenuOlusturRedirect() {
  redirect("/menu-gunlugu");
}
