import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_MB   = 10;
const TARGET_KB     = 500;
const MAX_WIDTH     = 1400;
const BUCKET        = "recipes";

async function compressImage(buffer: Buffer): Promise<Buffer> {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const pipeline = img.resize({
    width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH),
    withoutEnlargement: true,
  });
  let quality = 82;
  let result = await pipeline.webp({ quality }).toBuffer();
  while (result.byteLength > TARGET_KB * 1024 && quality > 40) {
    quality -= 8;
    result = await pipeline.webp({ quality }).toBuffer();
  }
  return result;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!serviceKey || serviceKey.includes("your-service")) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Desteklenmeyen format. İzin verilenler: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Dosya çok büyük. Maksimum ${MAX_SIZE_MB}MB` },
      { status: 400 }
    );
  }

  const original  = Buffer.from(await file.arrayBuffer());
  const compressed = await compressImage(original);
  const filename  = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, compressed, { contentType: "image/webp", upsert: false });

  if (error) {
    console.error("[admin/upload] storage error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({ url: publicUrl });
}
