import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.type === "image/png" ? "png" : "jpg";
    const path   = `bug-reports/${Date.now()}.${ext}`;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from("recipes")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from("recipes").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Yükleme hatası." }, { status: 500 });
  }
}
