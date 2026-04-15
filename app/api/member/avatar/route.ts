import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB   = 5;
const AVATAR_SIZE   = 400; // kare profil fotoğrafı (px)
const BUCKET        = "recipes";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Sadece JPG, PNG veya WebP yükleyebilirsiniz." }, { status: 400 });
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return NextResponse.json({ error: `Dosya ${MAX_SIZE_MB} MB'dan küçük olmalı.` }, { status: 400 });

  // Kare kırp ve WebP'ye dönüştür (~50-100 KB hedef)
  const original   = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(original)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  // Her kullanıcı için aynı yol — upsert ile üzerine yaz
  const path       = `avatar/${user.id}.webp`;
  const adminSupa  = createAdminClient();

  const { error: uploadErr } = await adminSupa.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: "image/webp", upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminSupa.storage.from(BUCKET).getPublicUrl(path);

  // Tarayıcı önbelleğini aşmak için sürüm parametresi ile kaydet
  const urlWithVersion = `${publicUrl}?v=${Date.now()}`;

  const { error: updateErr } = await adminSupa
    .from("profiles")
    .update({ avatar_url: urlWithVersion })
    .eq("id", user.id);

  if (updateErr) return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });

  return NextResponse.json({ url: urlWithVersion });
}
