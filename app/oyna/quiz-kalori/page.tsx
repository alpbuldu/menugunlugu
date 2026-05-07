import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import QuizKaloriGame from "./QuizKaloriGame";

export const metadata: Metadata = {
  title: "Quiz — Kalorisini Tahmin Et | Oyna",
  description: "Yemeği görüyorsun ama kaç kalori? Sezgin ne kadar güçlü?",
};

export const dynamic = "force-dynamic";

export interface KaloriQuestion {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  kcal: number;
  options: number[];
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function generateOptions(correct: number): number[] {
  const range = correct > 500 ? 200 : correct > 250 ? 100 : 60;
  const step  = correct > 400 ? 25 : 10;
  const wrong = new Set<number>();
  let tries = 0;
  while (wrong.size < 3 && tries < 200) {
    tries++;
    const delta = (Math.floor(Math.random() * (range / step)) + 1) * step;
    const sign  = Math.random() < 0.5 ? 1 : -1;
    const v = Math.round((correct + sign * delta) / step) * step;
    if (v !== correct && v > 0 && v < 3000) wrong.add(v);
  }
  return shuffle([correct, ...Array.from(wrong)]);
}

export default async function QuizKaloriPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, title, slug, image_url, kcal_per_person")
    .eq("approval_status", "approved")
    .not("image_url", "is", null)
    .not("kcal_per_person", "is", null)
    .gt("kcal_per_person", 0)
    .limit(300);

  const pool = shuffle(data ?? []).slice(0, 10) as any[];
  const questions: KaloriQuestion[] = pool.map(r => ({
    id:        r.id,
    title:     r.title,
    slug:      r.slug,
    image_url: r.image_url,
    kcal:      r.kcal_per_person,
    options:   generateOptions(r.kcal_per_person),
  }));

  return <QuizKaloriGame questions={questions} />;
}
