"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton() {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/member/delete-account", { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Hesap silinemedi.");
      return;
    }

    // Önce oturumu kapat, sonra anasayfaya yönlendir
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
      >
        Hesabımı kalıcı olarak sil
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-base font-semibold text-warm-900">Hesabı Sil</h2>
            <p className="text-sm text-warm-600 leading-relaxed">
              Hesabınız, tüm verilerinizle birlikte <span className="font-semibold text-red-500">kalıcı olarak</span> silinecek.
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </p>

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setOpen(false); setError(""); }}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Siliniyor…" : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
