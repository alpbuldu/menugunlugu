import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import TurnuvaGame from "./TurnuvaGame";

export const metadata: Metadata = {
  title: "Turnuva | Oyna",
  description: "Yemekler kapışıyor — tek şampiyon kalana kadar seç!",
};

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export default async function TurnuvaPage() {
  const supabase = createAdminClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, slug, image_url, category")
    .eq("approval_status", "approved")
    .not("image_url", "is", null)
    .limit(200);

  const bracket = shuffle(recipes ?? []).slice(0, 8);
  return <TurnuvaGame bracket={bracket as any} />;
}
