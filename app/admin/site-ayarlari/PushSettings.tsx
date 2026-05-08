"use client";

import { useState } from "react";

type Props = {
  settings: {
    daily_push_time: string | null;
    push_title: string | null;
    push_body: string | null;
  };
};

export default function PushSettings({ settings }: Props) {
  const [time,    setTime]    = useState(settings.daily_push_time?.slice(0, 5) ?? "09:00");
  const [title,   setTitle]   = useState(settings.push_title  ?? "Günün Menüsü 🍽️");
  const [body,    setBody]    = useState(settings.push_body   ?? "Bugünün özel menüsü hazır! Hemen inceleyin.");
  const [saving,  setSaving]  = useState(false);
  const [sending, setSending] = useState(false);
  const [msg,     setMsg]     = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/site-ayarlari", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_push_time: time + ":00", push_title: title, push_body: body }),
    });
    setSaving(false);
    setMsg(res.ok ? "✅ Kaydedildi." : "❌ Kayıt hatası.");
  }

  async function handleSendNow() {
    if (!confirm(`"${title}" başlıklı bildirimi tüm kullanıcılara göndermek istediğine emin misin?`)) return;
    setSending(true); setMsg("");
    const res = await fetch("/api/admin/bildirim-gonder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json();
    setSending(false);
    setMsg(res.ok ? `✅ ${data.sent ?? 0} cihaza gönderildi.` : `❌ ${data.error ?? "Hata"}`);
  }

  return (
    <section className="bg-white rounded-2xl border border-warm-200 p-6">
      <h2 className="text-base font-bold text-warm-900 mb-1">Push Bildirim Ayarları</h2>
      <p className="text-sm text-warm-500 mb-5">Günlük menü bildiriminin saatini ve içeriğini belirleyin.</p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-1">
            Günlük Gönderim Saati
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-warm-400 mt-1">Her gün bu saatte otomatik push gönderilir.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-1">Bildirim Başlığı</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={64}
            className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-1">Bildirim Metni</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={128}
            className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm text-warm-900 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        {msg && <p className="text-sm font-medium">{msg}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={handleSendNow}
            disabled={sending}
            className="px-5 py-2 bg-warm-800 hover:bg-warm-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {sending ? "Gönderiliyor…" : "Şimdi Gönder"}
          </button>
        </div>
      </form>
    </section>
  );
}
