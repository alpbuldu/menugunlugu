"use client";

import { useState, useEffect } from "react";
import { createAdminClient } from "@/lib/supabase/server";

// Bu sayfa server-side log çekimi + client-side form
// İkiye ayırdık: log listesi ayrı server component, form client

export default function BildirimlerPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-warm-900">📲 Push Bildirimler</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SendForm />
        <LogList />
      </div>
    </div>
  );
}

/* ── Gönderme formu ── */
function SendForm() {
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [target, setTarget] = useState<"all" | "test">("test");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ ok?: boolean; sent?: number; total?: number; error?: string } | null>(null);
  const [tokenCount, setTokenCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/push-token-count")
      .then(r => r.json())
      .then(d => setTokenCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (target === "all" && !confirm(`Tüm ${tokenCount ?? "?"} cihaza bildirim gönderilecek. Onaylıyor musun?`)) return;

    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/push-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, target }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
    if (data.ok) { setTitle(""); setBody(""); }
  }

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-warm-50 flex items-center justify-between">
        <h2 className="font-bold text-warm-900">Bildirim Gönder</h2>
        {tokenCount !== null && (
          <span className="text-xs text-warm-400 bg-warm-50 px-2 py-1 rounded-full">
            {tokenCount.toLocaleString("tr-TR")} kayıtlı cihaz
          </span>
        )}
      </div>

      <form onSubmit={handleSend} className="p-5 space-y-4">
        {/* Hedef */}
        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-2">Hedef</label>
          <div className="flex gap-3">
            {([["test", "🧪 Test (5 cihaz)"], ["all", "📢 Tümüne Gönder"]] as const).map(([v, lbl]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTarget(v)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  target === v
                    ? "bg-brand-50 border-brand-400 text-brand-700"
                    : "bg-white border-warm-200 text-warm-500 hover:border-warm-300"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Başlık */}
        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-1">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Örn: Günün Menüsü Hazır 🍽️"
            maxLength={100}
            required
            className="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-brand-400"
          />
          <p className="text-xs text-warm-400 mt-1">{title.length}/100</p>
        </div>

        {/* İçerik */}
        <div>
          <label className="block text-sm font-semibold text-warm-700 mb-1">İçerik</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Örn: Bugün çorba, ana yemek ve tatlı sizi bekliyor!"
            maxLength={200}
            rows={3}
            required
            className="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm text-warm-900 focus:outline-none focus:border-brand-400 resize-none"
          />
          <p className="text-xs text-warm-400 mt-1">{body.length}/200</p>
        </div>

        {/* Önizleme */}
        {(title || body) && (
          <div className="bg-warm-50 border border-warm-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-warm-500 mb-2">📱 Önizleme</p>
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-sm font-bold text-warm-900">{title || "Başlık"}</p>
              <p className="text-xs text-warm-600 mt-1">{body || "İçerik..."}</p>
            </div>
          </div>
        )}

        {/* Sonuç */}
        {result && (
          <div className={`rounded-xl p-3 text-sm ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {result.ok
              ? `✅ ${result.sent} cihaza gönderildi (toplam ${result.total})`
              : `❌ ${result.error ?? "Gönderme başarısız."}`
            }
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !title.trim() || !body.trim()}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "Gönderiliyor..." : target === "test" ? "Test Gönder" : "Tümüne Gönder"}
        </button>
      </form>
    </div>
  );
}

/* ── Log listesi (client-side fetch) ── */
interface LogEntry {
  id: string;
  title: string;
  body: string;
  target: string;
  sent_count: number;
  fail_count: number;
  total_tokens: number;
  created_at: string;
}

function LogList() {
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/push-log")
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-warm-50">
        <h2 className="font-bold text-warm-900">Gönderim Geçmişi</h2>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-sm text-warm-400 text-center">Yükleniyor...</div>
      ) : logs.length === 0 ? (
        <div className="px-5 py-8 text-sm text-warm-400 text-center">Henüz bildirim gönderilmedi.</div>
      ) : (
        <ul className="divide-y divide-warm-50">
          {logs.map(log => (
            <li key={log.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-warm-900 truncate">{log.title}</p>
                  <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{log.body}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  log.target === "all" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {log.target === "all" ? "Tümüne" : "Test"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-green-600">✓ {log.sent_count} gönderildi</span>
                {log.fail_count > 0 && (
                  <span className="text-xs text-red-500">✗ {log.fail_count} başarısız</span>
                )}
                <span className="text-xs text-warm-400 ml-auto">
                  {new Date(log.created_at).toLocaleString("tr-TR", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
