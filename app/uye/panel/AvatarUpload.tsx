"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** true → ikon + "Fotoğraf" etiketi göster (web), false → sadece ikon (mobil) */
  label?: boolean;
  className?: string;
}

export default function AvatarUpload({ label = true, className = "" }: Props) {
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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
      <div className="flex flex-col items-start gap-0.5">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Profil fotoğrafı değiştir"
          className={[
            "flex items-center gap-1.5 rounded-xl border transition-colors",
            label
              ? "px-3 py-2 text-sm font-medium bg-warm-100 hover:bg-warm-200 text-warm-700 border-warm-200"
              : "p-2 text-base bg-warm-100 hover:bg-warm-200 text-warm-700 border-warm-200",
            uploading ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {/* Kamera ikonu */}
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {label && (
            <span>{uploading ? "Yükleniyor…" : "Profil Fotoğrafı Yükle"}</span>
          )}
        </button>
        {error && <p className="text-[11px] text-red-500 leading-snug max-w-[120px]">{error}</p>}
      </div>
    </div>
  );
}
