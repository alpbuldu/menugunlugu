import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const body = await req.json();

  const { error } = await supabase
    .from("site_settings")
    .upsert({
      id: 1,
      logo_url:      body.logo_url      ?? null,
      favicon_url:   body.favicon_url   ?? null,
      contact_email: body.contact_email ?? null,
      instagram_url: body.instagram_url ?? null,
      youtube_url:   body.youtube_url   ?? null,
      tiktok_url:    body.tiktok_url    ?? null,
      twitter_url:   body.twitter_url   ?? null,
    }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
