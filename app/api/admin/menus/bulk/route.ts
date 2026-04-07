import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// POST — toplu menü ekle
export async function POST(request: NextRequest) {
  try {
    const { menus, status = "published" } = await request.json();

    if (!Array.isArray(menus) || menus.length === 0) {
      return NextResponse.json({ error: "Menü listesi boş" }, { status: 400 });
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }

    const rows = menus.filter(
      (m: { date?: string; soup_id?: string; main_id?: string; side_id?: string; dessert_id?: string }) =>
        m.date && m.soup_id && m.main_id && m.side_id && m.dessert_id
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Geçerli menü bulunamadı" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Mevcut tarihleri çek — aynı tarihli menü varsa atla
    const dates = rows.map((m: { date: string }) => m.date);

    const { data: existing } = await supabase
      .from("menus")
      .select("date")
      .in("date", dates);

    const existingDates = new Set((existing ?? []).map((m: { date: string }) => m.date));

    const newRows = rows
      .filter((m: { date: string }) => !existingDates.has(m.date))
      .map((m: { date: string; soup_id: string; main_id: string; side_id: string; dessert_id: string }) => ({
        date:       m.date,
        soup_id:    m.soup_id,
        main_id:    m.main_id,
        side_id:    m.side_id,
        dessert_id: m.dessert_id,
        status,
      }));

    const skipped = rows.length - newRows.length;

    if (newRows.length === 0) {
      return NextResponse.json({ imported: 0, skipped });
    }

    const { data, error } = await supabase
      .from("menus")
      .insert(newRows)
      .select("id, date");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ imported: data?.length ?? newRows.length, skipped });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — toplu menü sil
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ID listesi boş" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("menus").delete().in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
