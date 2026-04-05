"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  endpoint: string;        // e.g. /api/recipes/abc123
  label?:   string;        // confirmation text
  onSuccess?: () => void;
}

export default function DeleteButton({ endpoint, label = "Bu öğeyi silmek istediğinizden emin misiniz?", onSuccess }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleDelete() {
    if (!window.confirm(label)) return;

    setLoading(true);
    setError("");

    const res  = await fetch(endpoint, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      setError(data.error ?? "Silinemedi.");
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50 transition-colors"
      >
        {loading ? "Siliniyor…" : "Sil"}
      </button>
      {error && (
        <span className="text-xs text-red-500 max-w-xs text-right">{error}</span>
      )}
    </span>
  );
}
