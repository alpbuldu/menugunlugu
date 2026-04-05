import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RECIPE_FIELDS =
  "id, title, slug, category, ingredients, instructions, image_url, created_at";

const MENU_WITH_RECIPES = `
  id, date, status, created_at,
  soup:soup_id(${RECIPE_FIELDS}),
  main:main_id(${RECIPE_FIELDS}),
  side:side_id(${RECIPE_FIELDS}),
  dessert:dessert_id(${RECIPE_FIELDS})
`.trim();

export async function GET() {
  // Use local-timezone date (YYYY-MM-DD) — avoids UTC-offset mismatches
  const today = new Date().toLocaleDateString("en-CA");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menus")
    .select(MENU_WITH_RECIPES)
    .eq("date", today)
    .eq("status", "published")
    .single();

  if (error || !data) {
    // Return the Supabase error + the exact date string used so you can
    // compare it against what is stored in the menus table.
    return NextResponse.json(
      {
        error: "No published menu found for today",
        debug: {
          date_queried: today,
          supabase_error: error?.message ?? null,
          supabase_code: error?.code ?? null,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ menu: data });
}
