import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // Admin kontrolü
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title ve body gerekli" }, { status: 400 });
  }

  // Tüm push token'ları çek
  const { data: tokens } = await admin
    .from("push_tokens")
    .select("token")
    .limit(1000);

  if (!tokens?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Expo Push API'ya gönder (100'lük batch'ler)
  const BATCH = 100;
  let sent = 0;

  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH).map((t) => ({
      to: t.token,
      title,
      body,
      sound: "default",
    }));

    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
    } catch {
      // batch başarısız — devam et
    }
  }

  return NextResponse.json({ sent });
}
