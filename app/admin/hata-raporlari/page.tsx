import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hata Raporları" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  bug:     "🐛 Teknik Hata",
  ui:      "🎨 Görsel Sorun",
  content: "📝 İçerik Sorunu",
  other:   "💬 Diğer",
};
const TYPE_COLOR: Record<string, string> = {
  bug:     "bg-red-50 text-red-700 border-red-200",
  ui:      "bg-purple-50 text-purple-700 border-purple-200",
  content: "bg-blue-50 text-blue-700 border-blue-200",
  other:   "bg-warm-50 text-warm-600 border-warm-200",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins} dakika önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7)   return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

export default async function HataRaporlariPage() {
  const supabase = createAdminClient();

  const { data: reports } = await supabase
    .from("bug_reports")
    .select("id, type, description, image_url, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((reports ?? []).map((r: any) => r.user_id).filter(Boolean))];
  const profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p.username; });
  }

  const rows = (reports ?? []) as any[];
  const total   = rows.length;
  const byType  = rows.reduce((acc: any, r: any) => { acc[r.type] = (acc[r.type] ?? 0) + 1; return acc; }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-warm-900">Hata Raporları</h1>
        <span className="text-sm text-warm-400">{total} rapor</span>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {Object.entries(TYPE_LABEL).map(([key, label]) => (
          <div key={key} className="bg-white rounded-xl border border-warm-100 p-4 text-center">
            <div className="text-2xl font-bold text-warm-900">{byType[key] ?? 0}</div>
            <div className="text-xs text-warm-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {rows.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-lg font-semibold">Hata raporu yok</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`text-xs font-700 border rounded-full px-3 py-1 ${TYPE_COLOR[r.type] ?? TYPE_COLOR.other}`}>
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                  <span className="text-xs text-warm-400 shrink-0">{timeAgo(r.created_at)}</span>
                </div>

                <p className="text-sm text-warm-800 leading-relaxed whitespace-pre-wrap">{r.description}</p>

                {r.image_url && (
                  <div className="mt-4">
                    <a href={r.image_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={r.image_url}
                        alt="Hata görseli"
                        className="rounded-xl max-h-64 object-contain border border-warm-100 cursor-zoom-in"
                      />
                    </a>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-warm-400">
                  <span>👤</span>
                  <span>
                    {r.user_id
                      ? (profileMap[r.user_id] ? `@${profileMap[r.user_id]}` : `Üye (${r.user_id.slice(0,8)}…)`)
                      : "Anonim"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
