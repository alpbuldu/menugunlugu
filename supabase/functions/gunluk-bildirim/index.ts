import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_PUSH_URL     = "https://exp.host/--/api/v2/push/send";

/** İstanbul'da bugünün tarihini döner: YYYY-MM-DD */
function todayIstanbul(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** İstanbul'daki şu anki saati HH:MM olarak döner */
function nowTimeIstanbul(): string {
  return new Date().toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

Deno.serve(async (req) => {
  // Supabase'in cron çağrılarında Authorization header gelmeyebilir —
  // service_role zaten Deno.env'den alınıyor, header kontrolü isteğe bağlı.
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── 1. site_settings'i çek ──────────────────────────────────────────────
  const { data: settings } = await supabase
    .from("site_settings")
    .select("daily_push_time, push_title, push_body, last_push_sent_date")
    .eq("id", 1)
    .single();

  if (!settings) {
    return new Response(JSON.stringify({ error: "site_settings bulunamadı" }), { status: 500 });
  }

  const pushTime        = (settings.daily_push_time as string | null)?.slice(0, 5) ?? "09:00"; // HH:MM
  const pushTitle       = (settings.push_title as string | null) ?? "Günün Menüsü 🍽️";
  const pushBody        = (settings.push_body  as string | null) ?? "Bugünün özel menüsü hazır!";
  const lastSentDate    = settings.last_push_sent_date as string | null;
  const today           = todayIstanbul();
  const nowTime         = nowTimeIstanbul(); // HH:MM

  // ── 2. Zaten bugün gönderildiyse çık ────────────────────────────────────
  if (lastSentDate === today) {
    return new Response(JSON.stringify({ skipped: "already_sent_today" }), { status: 200 });
  }

  // ── 3. Henüz zamanı gelmediyse çık ──────────────────────────────────────
  if (nowTime < pushTime) {
    return new Response(
      JSON.stringify({ skipped: "not_yet", now: nowTime, pushTime }),
      { status: 200 }
    );
  }

  // ── 4. Bugünün menüsü published mı? ─────────────────────────────────────
  const { data: menu } = await supabase
    .from("menus")
    .select("id")
    .eq("date", today)
    .eq("status", "published")
    .maybeSingle();

  if (!menu) {
    return new Response(
      JSON.stringify({ skipped: "no_published_menu", date: today }),
      { status: 200 }
    );
  }

  // ── 5. Tüm push token'ları çek ───────────────────────────────────────────
  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("user_id, token");

  const tokens = tokenRows ?? [];

  // ── 6. Expo Push API'ya gönder (100'lük batch'ler) ───────────────────────
  const BATCH = 100;
  let sent = 0;

  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH).map((t) => ({
      to: t.token,
      title: pushTitle,
      body: pushBody,
      sound: "default",
      data: { type: "gunun_menusu", date: today },
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
    } catch {
      // batch hatasını geç
    }
  }

  // ── 7. Kullanıcı başına uygulama içi bildirim ekle ───────────────────────
  const uniqueUserIds = [...new Set(tokens.map((t) => t.user_id))];

  if (uniqueUserIds.length > 0) {
    const notifRows = uniqueUserIds.map((user_id) => ({
      user_id,
      type: "gunun_menusu",
      title: pushTitle,
      body: pushBody,
      data: { date: today },
      is_read: false,
    }));

    // 500'lük batch'ler (Supabase insert limiti)
    for (let i = 0; i < notifRows.length; i += 500) {
      await supabase.from("notifications").insert(notifRows.slice(i, i + 500));
    }
  }

  // ── 8. last_push_sent_date güncelle ──────────────────────────────────────
  await supabase
    .from("site_settings")
    .update({ last_push_sent_date: today })
    .eq("id", 1);

  return new Response(
    JSON.stringify({ ok: true, sent, users: uniqueUserIds.length, date: today }),
    { status: 200 }
  );
});
