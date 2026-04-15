"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /**
   * "inline"  → ikon + "Profil Fotoğrafı Yükle" yan yana (web)
   * "stacked" → ikon üstte, küçük yazı altta (mobil sağ kolon)
   * "icon"    → sadece ikon
   */
  variant?: "inline" | "stacked" | "icon";
  className?: string;
}

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function AvatarUpload({ variant = "inline", className = "" }: Props) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const router = useRouter();

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/member/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Yükleme başarısız."); return; }
    router.refresh();
  }

  const baseCls = "rounded-xl border transition-colors bg-warm-100 hover:bg-warm-200 text-warm-700 border-warm-200";
  const disabledCls = uploading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className={`${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* Stacked: ikon üstte, yazı altta — mobil sağ kolon */}
      {variant === "stacked" && (
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Profil fotoğrafı değiştir"
            className={`flex items-center justify-center p-2 ${baseCls} ${disabledCls}`}
          >
            <CameraIcon />
          </button>
          <span className="text-[10px] text-warm-500 text-center leading-tight w-12">
            {uploading ? "Yükleniyor" : "Fotoğraf Yükle"}
          </span>
          {error && <p className="text-[10px] text-red-500 leading-snug text-center w-14">{error}</p>}
        </div>
      )}

      {/* Inline: ikon + uzun yazı yan yana — web */}
      {variant === "inline" && (
        <div className="flex flex-col items-start gap-0.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Profil fotoğrafı değiştir"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${baseCls} ${disabledCls}`}
          >
            <CameraIcon />
            <span>{uploading ? "Yükleniyor…" : "Profil Fotoğrafı Yükle"}</span>
          </button>
          {error && <p className="text-[11px] text-red-500 leading-snug max-w-[160px]">{error}</p>}
        </div>
      )}

      {/* Icon only */}
      {variant === "icon" && (
        <div className="flex flex-col items-start gap-0.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="Profil fotoğrafı değiştir"
            className={`flex items-center justify-center p-2 ${baseCls} ${disabledCls}`}
          >
            <CameraIcon />
          </button>
          {error && <p className="text-[11px] text-red-500 leading-snug">{error}</p>}
        </div>
      )}
    </div>
  );
}
