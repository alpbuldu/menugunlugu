import { createAdminClient } from "@/lib/supabase/server";
import AdminProfileForm from "./AdminProfileForm";
import MigrationBox from "./MigrationBox";
import type { Metadata } from "next";
import type { AdminProfile } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Profili" };

export default async function AdminProfilPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_profile")
    .select("*")
    .eq("id", 1)
    .single();

  const profile: AdminProfile = data ?? {
    id: 1,
    username: "Menü Günlüğü",
    avatar_url: null,
    updated_at: new Date().toISOString(),
  };

  // comment_user_id kolonu var mı kontrol et
  const hasCommentUserId = data && "comment_user_id" in data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Admin Profili</h1>
        <p className="text-warm-500 text-sm mt-1">
          Tariflerin altında yazar olarak görünecek profil bilgileri
        </p>
      </div>

      {!hasCommentUserId && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Yorum hesabı özelliği için 1 adım gerekiyor</p>
          <p className="text-xs text-amber-700 mb-3">
            Supabase Dashboard → SQL Editor'a gidip aşağıdaki komutu çalıştırın, ardından sayfayı yenileyin:
          </p>
          <MigrationBox />
        </div>
      )}

      <AdminProfileForm profile={profile} />
    </div>
  );
}
