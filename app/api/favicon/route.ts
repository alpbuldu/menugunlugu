import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("site_settings")
    .select("favicon_url")
    .eq("id", 1)
    .single();

  if (!data?.favicon_url) {
    return new NextResponse(null, { status: 404 });
  }

  // Redirect to actual image — no-cache forces browser to always re-check
  return NextResponse.redirect(data.favicon_url, {
    status: 302,
    headers: {
      "Cache-Control": "no-cache, must-revalidate",
    },
  });
}
