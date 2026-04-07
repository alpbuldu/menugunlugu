import { createAdminClient } from "./server";

const BUCKET = "recipes";

/**
 * Supabase Storage public URL'inden dosya yolunu çıkarır ve dosyayı siler.
 * URL formatı: https://{proje}.supabase.co/storage/v1/object/public/{bucket}/{path}
 * Supabase dışı URL'lerde sessizce çıkar.
 */
export async function deleteStorageFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  // Sadece bu projenin storage URL'lerini işle
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.startsWith(supabaseUrl)) return;

  // /storage/v1/object/public/{bucket}/ sonrasını al
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx    = url.indexOf(marker);
  if (idx === -1) return;

  const filePath = url.slice(idx + marker.length);
  if (!filePath) return;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) console.error("[deleteStorageFile]", error.message);
  } catch (e) {
    console.error("[deleteStorageFile] unexpected:", e);
  }
}
