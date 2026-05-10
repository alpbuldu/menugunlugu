import type { Metadata } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import HeroSlidesClient from "./HeroSlidesClient";

export const metadata: Metadata = { title: "Hero Slider" };
export const dynamic = "force-dynamic";

async function getSlides() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export default async function HeroSlidesPage() {
  const slides = await getSlides();
  return <HeroSlidesClient initialSlides={slides} />;
}
