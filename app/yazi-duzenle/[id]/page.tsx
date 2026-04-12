import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PostEditForm from "./PostEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Yazıyı Düzenle" };

interface Props { params: Promise<{ id: string }> }

export default async function YaziDuzenlePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("member_posts")
    .select("id, title, excerpt, content, image_url, approval_status, submitted_by")
    .eq("id", id)
    .single();

  if (!post) notFound();
  if (post.submitted_by !== user.id) redirect("/uye/panel?tab=yazilarim");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/uye/panel?tab=yazilarim"
          className="text-sm text-warm-400 hover:text-warm-600 transition-colors">
          ← Yazılarım
        </Link>
        <span className="text-warm-200">/</span>
        <h1 className="text-2xl font-bold text-warm-900">Yazıyı Düzenle</h1>
      </div>
      <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
        <PostEditForm post={post} />
      </div>
    </div>
  );
}
