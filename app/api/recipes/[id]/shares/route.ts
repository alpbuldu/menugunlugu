import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// POST — paylaşım sayacı artır
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const adminSb = createAdminClient();

  const { error } = await adminSb
    .from("recipe_shares")
    .insert({ recipe_id: id });

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
