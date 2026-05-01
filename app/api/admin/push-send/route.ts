import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  // Expo'nun ücretsiz push servisi — maksimum 100 mesaj per request
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  const results: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    const json = await res.json();
    results.push(...(json.data ?? []));
  }
  return results;
}

export async function POST(req: NextRequest) {
  const { title, body, data, target } = await req.json() as {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    target: "all" | "test";
  };

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Başlık ve içerik zorunlu." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Token listesini çek
  let q = supabase.from("push_tokens").select("token");
  if (target === "test") q = q.limit(5); // Test modunda sadece 5 cihaz

  const { data: tokens, error } = await q;
  if (error) return NextResponse.json({ error: "Token listesi alınamadı." }, { status: 500 });
  if (!tokens?.length) return NextResponse.json({ error: "Kayıtlı token bulunamadı." }, { status: 404 });

  const messages: ExpoPushMessage[] = tokens.map(t => ({
    to:    t.token,
    title: title.trim(),
    body:  body.trim(),
    sound: "default",
    data:  data ?? {},
  }));

  const tickets = await sendExpoPushNotifications(messages);

  const ok      = tickets.filter(t => t.status === "ok").length;
  const failed  = tickets.filter(t => t.status === "error").length;

  // Bildirim kaydını Supabase'e yaz
  await supabase.from("push_notifications_log").insert({
    title:       title.trim(),
    body:        body.trim(),
    target,
    sent_count:  ok,
    fail_count:  failed,
    total_tokens: tokens.length,
  }).catch(() => {}); // log başarısız olursa sessizce geç

  return NextResponse.json({ ok: true, sent: ok, failed, total: tokens.length });
}
