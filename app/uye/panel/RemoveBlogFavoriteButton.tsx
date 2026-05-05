"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RemoveBlogFavoriteButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    await supabase.from("blog_favorites").delete().eq("post_id", postId).eq("user_id", user.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      title="Defterden kaldır"
      className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 hover:bg-red-50 text-warm-400 hover:text-red-500 shadow-sm transition-colors disabled:opacity-50 text-xs"
    >
      {loading ? "…" : "✕"}
    </button>
  );
}
