"use client";

import { useState, useRef } from "react";

interface PagePopup {
  page: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  home:          "Ana Sayfa",
  gunun_menusu:  "Günün Menüsü",
  dunun_menusu:  "Dünün Menüsü",
  tarifler:      "Tarifler",
  tarif_detay:   "Tarif Detayı",
  blog:          "Blog",
  blog_yazisi:   "Blog Yazısı",
  menu_olustur:  "Menü Oluştur",
};

function PopupRow({ popup }: { popup: PagePopup }) {
  const [imageUrl,  setImageUrl]  = useState(popup.image_url  ?? "");
  const [linkUrl,   setLinkUrl]   = useState(popup.link_url   ?? "");
  const [isActive,  setIsActive]  = useState(popup.is_active);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setImageUrl(data.url);
    else setMsg("Yükleme başarısız.");
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/page-popups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page:      popup.page,
        image_url: imageUrl || null,
        link_url:  linkUrl.trim() || null,
        is_active: isActive,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? "✅ Kaydedildi." : "❌ Hata oluştu.");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div className="border border-warm-200 rounded-xl p-4 space-y-3">
      {/* Başlık + toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-warm-800">{PAGE_LABELS[popup.page] ?? popup.page}</span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs text-warm-400">{isActive ? "Açık" : "Kapalı"}</span>
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)} />
            <div className={`w-9 h-5 rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-warm-200"}`} />
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </label>
      </div>

      <div className="flex items-start gap-3">
        {/* Görsel önizleme + yükle */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-lg border border-warm-200 bg-warm-50 overflow-hidden flex items-center justify-center">
            {imageUrl
              ? <img src={imageUrl} alt="Popup" className="w-full h-full object-cover" />
              : <span className="text-2xl">🪟</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="mt-1.5 w-16 text-center text-[10px] text-warm-500 hover:text-brand-600 transition-colors disabled:opacity-50 leading-tight">
            {uploading ? "Yükleniyor…" : imageUrl ? "Değiştir" : "Görsel Yükle"}
          </button>
          {imageUrl && (
            <button type="button" onClick={() => setImageUrl("")}
              className="block w-16 text-center text-[10px] text-red-400 hover:text-red-600 transition-colors mt-0.5">
              Kaldır
            </button>
          )}
        </div>

        {/* Link input + kaydet */}
        <div className="flex-1 space-y-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com (opsiyonel)"
            className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-brand-400 text-xs"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-medium transition-colors">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {msg && (
              <span className={`text-xs ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{msg}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PopupSettings({ popups }: { popups: PagePopup[] }) {
  return (
    <div className="border border-warm-200 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-warm-800">🪟 Sayfa Popupları</h2>
        <p className="text-xs text-warm-400 mt-1">
          Her sayfa için ayrı popup görseli ve linki tanımlayabilirsin.
          Açık olan sayfalar yüklendiğinde 1.5 sn sonra popup gösterilir, kapatıldıktan 4 saat sonra tekrar çıkar.
        </p>
      </div>
      <div className="space-y-3">
        {popups.map((p) => (
          <PopupRow key={p.page} popup={p} />
        ))}
      </div>
    </div>
  );
}
