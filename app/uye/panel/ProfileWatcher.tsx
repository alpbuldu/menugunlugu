"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Kullanıcının oturumunu ve profilini izler.
 *
 * Admin üyeyi sildiğinde:
 *   - Realtime varsa: profiles DELETE event → anında çıkış
 *   - Her zaman: tab'a dönüldüğünde getUser() + profil kontrolü → çıkış
 *   - Her zaman: onAuthStateChange SIGNED_OUT → çıkış
 */
export default function ProfileWatcher({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    let dead = false;

    async function checkSession() {
      if (dead) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        dead = true;
        window.location.href = "/giris?deleted=1";
        return;
      }
      // Profil hâlâ var mı?
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      if (!profile) {
        dead = true;
        await supabase.auth.signOut();
        window.location.href = "/giris?deleted=1";
      }
    }

    // Tab'a dönüldüğünde kontrol et
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Auth state change: SIGNED_OUT (token refresh başarısız olunca tetiklenir)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
          if (!dead) {
            dead = true;
            window.location.href = "/giris?deleted=1";
          }
        }
      }
    );

    // Realtime (Supabase dashboard'da profiles tablosu için etkinse bonus olarak çalışır)
    const channel = supabase
      .channel(`profile-watch-${userId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        async () => {
          if (!dead) {
            dead = true;
            await supabase.auth.signOut();
            window.location.href = "/giris?deleted=1";
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
