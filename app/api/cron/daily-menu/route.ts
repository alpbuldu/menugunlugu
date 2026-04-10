import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// ── helpers ──────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns tomorrow's date as YYYY-MM-DD in Istanbul timezone */
function tomorrowIstanbul(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** Returns today's month start and end (YYYY-MM-DD) in Istanbul timezone */
function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const y = parseInt(now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }).slice(0, 4));
  const m = parseInt(now.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }).slice(5, 7));
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const end = `${nextY}-${String(nextM).padStart(2, "0")}-01`;
  return { start, end };
}

function currentSeason(): string {
  const month = parseInt(new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }).slice(5, 7));
  if (month >= 3 && month <= 5) return "ilkbahar";
  if (month >= 6 && month <= 8) return "yaz";
  if (month >= 9 && month <= 11) return "sonbahar";
  return "kış";
}

// ── prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(usedTitles: string[], season: string, targetDate: string): string {
  const usedList = usedTitles.length > 0
    ? `Bu ay zaten eklenen yemekler (bunları tekrar ekleme):\n${usedTitles.map(t => `- ${t}`).join("\n")}\n\n`
    : "";

  return `Sen bir Türk mutfağı şefisin. ${targetDate} tarihi için 4 yemekten oluşan dengeli bir günlük menü hazırlayacaksın.

Mevsim: ${season}

${usedList}Kurallar:
- Menü şunlardan oluşmalı: 1 çorba, 1 ana yemek, 1 yardımcı lezzet (pilav / makarna / salata / sıcak garnitür), 1 tatlı
- %70 Türk mutfağı, %30 dünya mutfağı
- Mevsim: ${season} — mevsime uygun malzemeler kullan
- 4 yemek birbirini tamamlamalı (tat, renk, ağırlık dengesi)
- Yukarıdaki listede geçen yemekleri KESINLIKLE ekleme
- Her yemeğin malzemeleri ölçülü olmalı (su bardağı, yemek kaşığı, çay kaşığı, gram, adet vs.)
- Talimatlar adım adım paragraf biçiminde, pişirme süreleri ve püf noktaları içermeli
- Türkçe yaz

Yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir şey ekleme:

{
  "menu": {
    "soup": {
      "title": "Yemek Adı",
      "category": "soup",
      "servings": 4,
      "description": "Kısa ve iştah açıcı bir cümle (max 120 karakter)",
      "ingredients": "malzeme 1\\nmalzeme 2\\nmalzeme 3",
      "instructions": "1. paragraf açıklama.\\n\\n2. paragraf açıklama.\\n\\n3. paragraf açıklama."
    },
    "main": {
      "title": "Yemek Adı",
      "category": "main",
      "servings": 4,
      "description": "Kısa ve iştah açıcı bir cümle (max 120 karakter)",
      "ingredients": "malzeme 1\\nmalzeme 2\\nmalzeme 3",
      "instructions": "1. paragraf açıklama.\\n\\n2. paragraf açıklama.\\n\\n3. paragraf açıklama."
    },
    "side": {
      "title": "Yemek Adı",
      "category": "side",
      "servings": 4,
      "description": "Kısa ve iştah açıcı bir cümle (max 120 karakter)",
      "ingredients": "malzeme 1\\nmalzeme 2\\nmalzeme 3",
      "instructions": "1. paragraf açıklama.\\n\\n2. paragraf açıklama.\\n\\n3. paragraf açıklama."
    },
    "dessert": {
      "title": "Yemek Adı",
      "category": "dessert",
      "servings": 4,
      "description": "Kısa ve iştah açıcı bir cümle (max 120 karakter)",
      "ingredients": "malzeme 1\\nmalzeme 2\\nmalzeme 3",
      "instructions": "1. paragraf açıklama.\\n\\n2. paragraf açıklama.\\n\\n3. paragraf açıklama."
    }
  }
}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface RecipePayload {
  title: string;
  category: string;
  servings: number;
  description: string;
  ingredients: string;
  instructions: string;
}

interface MenuPayload {
  menu: {
    soup: RecipePayload;
    main: RecipePayload;
    side: RecipePayload;
    dessert: RecipePayload;
  };
}

// ── main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createAdminClient();
  const tomorrow = tomorrowIstanbul();
  const season   = currentSeason();
  const { start, end } = currentMonthRange();

  // 2. Check if menu already exists for tomorrow
  const { data: existingMenu } = await supabase
    .from("menus")
    .select("id")
    .eq("date", tomorrow)
    .maybeSingle();

  if (existingMenu) {
    return NextResponse.json({
      ok: false,
      message: `${tomorrow} için menü zaten mevcut (id: ${existingMenu.id})`,
    });
  }

  // 3. Get this month's used recipe titles
  const { data: monthMenus } = await supabase
    .from("menus")
    .select(`
      soup:soup_id(title),
      main:main_id(title),
      side:side_id(title),
      dessert:dessert_id(title)
    `)
    .gte("date", start)
    .lt("date", end);

  const usedTitles: string[] = [];
  if (monthMenus) {
    for (const m of monthMenus as Record<string, { title: string } | null>[]) {
      for (const key of ["soup", "main", "side", "dessert"]) {
        const r = m[key] as { title: string } | null;
        if (r?.title) usedTitles.push(r.title);
      }
    }
  }

  // 4. Call Anthropic API
  const prompt = buildPrompt(usedTitles, season, tomorrow);

  let parsed: MenuPayload;
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[daily-menu] Anthropic error:", errText);
      return NextResponse.json({ error: "Anthropic API error", detail: errText }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text ?? "";

    // Extract JSON — Claude sometimes wraps in ```json ... ```
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[daily-menu] No JSON in response:", rawText);
      return NextResponse.json({ error: "No JSON in Claude response", raw: rawText }, { status: 500 });
    }

    parsed = JSON.parse(jsonMatch[0]) as MenuPayload;
  } catch (err) {
    console.error("[daily-menu] Parse error:", err);
    return NextResponse.json({ error: "Failed to parse Claude response", detail: String(err) }, { status: 500 });
  }

  const { soup, main, side, dessert } = parsed.menu;

  // 5. Upsert each recipe (insert if not exists, return existing id otherwise)
  const recipeIds: Record<string, string> = {};

  for (const [slot, recipe] of [
    ["soup", soup], ["main", main], ["side", side], ["dessert", dessert]
  ] as [string, RecipePayload][]) {
    // Check by title (case-insensitive)
    const { data: existing } = await supabase
      .from("recipes")
      .select("id")
      .ilike("title", recipe.title.trim())
      .maybeSingle();

    if (existing) {
      recipeIds[slot] = existing.id;
      console.log(`[daily-menu] Recipe exists: ${recipe.title} → ${existing.id}`);
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("recipes")
        .insert({
          title:        recipe.title.trim(),
          slug:         toSlug(recipe.title.trim()),
          category:     recipe.category,
          servings:     recipe.servings ?? 4,
          description:  recipe.description ?? null,
          ingredients:  recipe.ingredients,
          instructions: recipe.instructions,
          created_at:   new Date().toISOString(),
          updated_at:   new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr || !inserted) {
        console.error(`[daily-menu] Failed to insert recipe ${recipe.title}:`, insertErr?.message);
        return NextResponse.json({
          error: `Recipe insert failed: ${recipe.title}`,
          detail: insertErr?.message,
        }, { status: 500 });
      }

      recipeIds[slot] = inserted.id;
      console.log(`[daily-menu] Recipe inserted: ${recipe.title} → ${inserted.id}`);
    }
  }

  // 6. Create menu row
  const { data: menuRow, error: menuErr } = await supabase
    .from("menus")
    .insert({
      date:       tomorrow,
      status:     "published",
      soup_id:    recipeIds["soup"],
      main_id:    recipeIds["main"],
      side_id:    recipeIds["side"],
      dessert_id: recipeIds["dessert"],
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (menuErr || !menuRow) {
    console.error("[daily-menu] Menu insert error:", menuErr?.message);
    return NextResponse.json({ error: "Menu insert failed", detail: menuErr?.message }, { status: 500 });
  }

  // 7. Return report
  const report = {
    ok: true,
    date: tomorrow,
    season,
    menu_id: menuRow.id,
    recipes: {
      soup:    { id: recipeIds["soup"],    title: soup.title },
      main:    { id: recipeIds["main"],    title: main.title },
      side:    { id: recipeIds["side"],    title: side.title },
      dessert: { id: recipeIds["dessert"], title: dessert.title },
    },
    generated_at: new Date().toISOString(),
  };

  console.log("[daily-menu] Success:", JSON.stringify(report, null, 2));
  return NextResponse.json(report);
}
