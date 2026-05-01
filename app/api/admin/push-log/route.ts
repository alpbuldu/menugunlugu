import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_notifications_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ logs: data ?? [] });
}
