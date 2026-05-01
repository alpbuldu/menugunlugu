import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("push_tokens")
    .select("*", { count: "exact", head: true });
  return NextResponse.json({ count: count ?? 0 });
}
