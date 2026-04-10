import { createAdminClient } from "@/lib/supabase/server";
import AdminProfileForm from "./AdminProfileForm";
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-warm-900">Admin Profili</h1>
        <p className="text-warm-500 text-sm mt-1">
          Tariflerin altında yazar olarak görünecek profil bilgileri
        </p>
      </div>
      <AdminProfileForm profile={profile} />
    </div>
  );
}
