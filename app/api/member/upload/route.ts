import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
// Kullanıcı en fazla 5 MB yükleyebilir; sunucu otomatik olarak ~500 KB WebP'ye sıkıştırır.
// Limit değiştirilmek istenirse MAX_SIZE_MB güncellenir.
const MAX_SIZE_MB   = 5;
const TARGET_KB     = 500; // hedef çıkış boyutu (KB)
const MAX_WIDTH     = 1400; // maksimum genişlik (px)
const BUCKET        = "recipes";

async function compressImage(buffer: Buffer): Promise<Buffer> {
  const img = sharp(buffer);
  const meta = await img.metadata();

  // Genişliği MAX_WIDTH ile sınırla, oranı koru
  const pipeline = img.resize({
    width:  Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH),
    withoutEnlargement: true,
  });

  // WebP olarak çıkar — en iyi sıkıştırma/kalite dengesi
  let quality = 82;
  let result  = await pipeline.webp({ quality }).toBuffer();

  // Hedef boyutun üstündeyse quality'yi düşür
  while (result.byteLength > TARGET_KB * 1024 && quality > 40) {
    quality -= 8;
    result = await pipeline.webp({ quality }).toBuffer();
  }

  return result;
}

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

  // Sıkıştır
  const original = Buffer.from(await file.arrayBuffer());
  const compressed = await compressImage(original);

  // Her zaman .webp olarak kaydet
  const path = `member/${user.id}/${Date.now()}.webp`;

  const adminSupabase = createAdminClient();
  const { error: uploadErr } = await adminSupabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: "image/webp", upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminSupabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}
