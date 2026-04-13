"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({ id, username }: { id: string; username: string }) {
  const router = useRouter();
  const [step,    setStep]    = useState<"idle" | "confirm" | "loading">("idle");
  const [error,   setError]   = useState("");

  async function handleDelete() {
    setStep("loading");
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Silme başarısız.");
      setStep("confirm");
      return;
    }
    router.refresh();
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
      >
        Sil
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col items-end gap-1">
        {error && <p className="text-[10px] text-red-500">{error}</p>}
        <p className="text-[10px] text-warm-500 text-right">@{username} silinsin mi?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 font-semibold hover:text-red-800 transition-colors"
          >
            Evet, sil
          </button>
          <span className="text-warm-300 text-xs">·</span>
          <button
            onClick={() => { setStep("idle"); setError(""); }}
            className="text-xs text-warm-400 hover:text-warm-600 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <span className="text-xs text-warm-400 animate-pulse">Siliniyor…</span>
  );
}
