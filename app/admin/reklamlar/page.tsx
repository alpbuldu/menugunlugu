import type { Metadata } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import ReklamlarClient from "./ReklamlarClient";

export const metadata: Metadata = { title: "Reklamlar" };
export const dynamic = "force-dynamic";

async function getAds() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function ReklamlarPage() {
  const ads = await getAds();
  return <ReklamlarClient initialAds={ads} />;
}
