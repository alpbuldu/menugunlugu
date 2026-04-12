"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  itemId: string;
  type?: "recipe" | "post";
}

export default function ApprovalActions({ itemId, type = "recipe" }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    await fetch("/api/admin/onay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, action, type }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => handle("reject")}
        disabled={!!loading}
        className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading === "reject" ? "İşleniyor…" : "🗑 Reddet"}
      </button>
      <button
        onClick={() => handle("approve")}
        disabled={!!loading}
        className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading === "approve" ? "İşleniyor…" : "✅ Onayla"}
      </button>
    </>
  );
}
