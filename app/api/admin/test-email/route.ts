import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Sadece admin için — production'da sileceğiz
export async function POST(req: NextRequest) {
  const { to } = await req.json();
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "RESEND_API_KEY tanımlı değil" }, { status: 500 });
  }

  try {
    const resend = new Resend(key);
    const from   = process.env.RESEND_FROM ?? "Menü Günlüğü <onboarding@resend.dev>";
    const result = await resend.emails.send({
      from,
      to:      to ?? "test@example.com",
      subject: "Test — Menü Günlüğü",
      html:    "<p>Resend çalışıyor! ✅</p>",
    });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
