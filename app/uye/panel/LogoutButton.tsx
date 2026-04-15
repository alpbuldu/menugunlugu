"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 rounded-xl border border-warm-200 hover:bg-warm-100 text-warm-600 text-sm font-medium transition-colors"
    >
      Çıkış
    </button>
  );
}
