import { NextRequest, NextResponse } from "next/server";
import { getMenuByDate } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date param required in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const menu = await getMenuByDate(date);

  if (!menu) {
    return NextResponse.json(
      { error: `No published menu found for ${date}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ menu });
}
