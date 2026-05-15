import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("daily_push_time, push_title, push_body")
    .eq("id", 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? {});
}

export async function PUT(req: Request) {
  const supabase = createAdminClient();
  const body = await req.json();

  // Sadece gönderilen alanları güncelle — gönderilmeyen alanlar null'a çekilmez.
  const ALLOWED_KEYS = [
    "logo_url", "favicon_url", "contact_email",
    "instagram_url", "youtube_url", "tiktok_url", "twitter_url",
    "adsense_enabled", "daily_push_time", "push_title", "push_body",
  ] as const;

  type AllowedKey = (typeof ALLOWED_KEYS)[number];

  const patch: Partial<Record<AllowedKey, unknown>> = {};
  for (const key of ALLOWED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      patch[key] = body[key];
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true }); // hiçbir şey değişmedi
  }

  const { error } = await supabase
    .from("site_settings")
    .update(patch)
    .eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
