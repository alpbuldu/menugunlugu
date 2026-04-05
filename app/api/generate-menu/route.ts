import { NextResponse } from "next/server";

export async function POST() {
  // TODO: call OpenAI API to generate 4 dishes and return as draft
  // Response shape:
  // {
  //   soup:    { title: string, category: "soup" },
  //   main:    { title: string, category: "main" },
  //   side:    { title: string, category: "side" },
  //   dessert: { title: string, category: "dessert" },
  // }
  return NextResponse.json({ message: "AI generation not yet connected" }, { status: 501 });
}
