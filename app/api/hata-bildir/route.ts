import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { type, description, image_url, user_id } = await req.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "Açıklama zorunlu." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // image_url sütunu yoksa graceful fallback
    let { error } = await supabase.from("bug_reports").insert({
      type:        type ?? "other",
      description: description.trim(),
      image_url:   image_url ?? null,
      user_id:     user_id   ?? null,
      created_at:  new Date().toISOString(),
    });

    if (error?.message?.includes("image_url")) {
      // Sütun henüz eklenmemişse image_url olmadan tekrar dene
      ({ error } = await supabase.from("bug_reports").insert({
        type:        type ?? "other",
        description: description.trim(),
        user_id:     user_id ?? null,
        created_at:  new Date().toISOString(),
      }));
    }

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Sunucu hatası." }, { status: 500 });
  }
}
