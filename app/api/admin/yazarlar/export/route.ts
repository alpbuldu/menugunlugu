import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  const [
    { data: profiles },
    { data: { users: authUsers } },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, instagram, twitter, youtube, website, created_at")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (!profiles) {
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }

  const authMap: Record<string, { email: string; marketing_consent: boolean }> = {};
  authUsers.forEach((u) => {
    authMap[u.id] = {
      email: u.email ?? "",
      marketing_consent: !!u.user_metadata?.marketing_consent,
    };
  });

  const header = [
    "kullanici_adi",
    "ad_soyad",
    "email",
    "pazarlama_izni",
    "instagram",
    "twitter",
    "youtube",
    "website",
    "katilim_tarihi",
  ].join(",");

  const rows = profiles.map((p) => {
    const auth = authMap[p.id] ?? { email: "", marketing_consent: false };
    const escape = (v: string | null | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    return [
      escape(p.username),
      escape(p.full_name),
      escape(auth.email),
      auth.marketing_consent ? "Evet" : "Hayır",
      escape(p.instagram),
      escape(p.twitter),
      escape(p.youtube),
      escape(p.website),
      new Date(p.created_at).toLocaleDateString("tr-TR"),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const bom  = "\uFEFF"; // UTF-8 BOM for Excel compatibility

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="uyeler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
