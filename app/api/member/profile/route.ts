import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { full_name, bio, instagram, twitter, youtube, website } = await request.json();

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({
    full_name:  full_name?.trim()  || null,
    bio:        bio?.trim()        || null,
    instagram:  instagram?.trim()  || null,
    twitter:    twitter?.trim()    || null,
    youtube:    youtube?.trim()    || null,
    website:    website?.trim()    || null,
  }).eq("id", user.id);

  if (error) return NextResponse.json({ error: "Güncelleme başarısız." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
