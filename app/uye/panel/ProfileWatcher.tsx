"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Kullanıcının profil satırını Realtime ile izler.
 * Admin profiles tablosundan silerse → oturum kapat → anasayfaya at.
 * Auth user silinirse → onAuthStateChange SIGNED_OUT → anasayfaya at.
 *
 * NOT: Realtime'ın çalışması için Supabase dashboard'da
 * "Database → Replication → supabase_realtime" altında
 * `profiles` tablosunun etkin olması gerekir.
 */
export default function ProfileWatcher({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();

    // 1) Realtime — profiles satırı silindiyse
    const channel = supabase
      .channel(`profile-watch-${userId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "DELETE",
          schema: "public",
          table:  "profiles",
          filter: `id=eq.${userId}`,
        },
        async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }
      )
      .subscribe();

    // 2) Auth state — auth.users silindiğinde ya da token geçersiz olduğunda
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_OUT" ||
          (event === "TOKEN_REFRESHED" && !session)
        ) {
          window.location.href = "/";
        }
      }
    );

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [userId]);

  return null;
}
