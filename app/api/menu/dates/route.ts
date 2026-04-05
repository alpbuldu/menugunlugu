import { NextRequest, NextResponse } from "next/server";
import { getMenuDatesForMonth } from "@/lib/supabase/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam  = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const year  = yearParam  ? parseInt(yearParam,  10) : new Date().getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "year and month must be valid numbers (month 1-12)" },
      { status: 400 }
    );
  }

  const dates = await getMenuDatesForMonth(year, month);
  return NextResponse.json({ dates });
}
