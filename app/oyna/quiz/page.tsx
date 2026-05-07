import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import QuizGame from "./QuizGame";

export const metadata: Metadata = {
  title: "Quiz — Yemeği Tahmin Et | Oyna",
  description: "Bulanık görsel, sınırlı ipucu. Yemeği tahmin edebilecek misin?",
};

export const dynamic = "force-dynamic";

export interface QuizRecipe {
  id: string;
  title: string;
  slug: string;
  category: string;
  image_url: string;
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default async function QuizPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, title, slug, category, image_url")
    .eq("approval_status", "approved")
    .not("image_url", "is", null)
    .limit(300);

  const all: QuizRecipe[] = (data ?? []) as QuizRecipe[];
  const byCategory: Record<string, QuizRecipe[]> = {};
  for (const r of all) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }

  // Her kategoriden yeterli soru olsun
  const pool = shuffle(all);
  const questions = pool.slice(0, 10).map(r => {
    const sameCategory = byCategory[r.category]?.filter(x => x.id !== r.id) ?? [];
    const wrong = shuffle(sameCategory).slice(0, 3);
    const options = shuffle([r, ...wrong]);
    return { recipe: r, options };
  });

  return <QuizGame questions={questions} />;
}
