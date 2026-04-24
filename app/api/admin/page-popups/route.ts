import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { page, image_url, link_url, is_active } = await req.json();

  if (!page) return NextResponse.json({ error: "page gerekli" }, { status: 400 });

  const { error } = await supabase
    .from("page_popups")
    .update({
      image_url:  image_url  ?? null,
      link_url:   link_url   ?? null,
      is_active:  is_active  ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("page", page);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
