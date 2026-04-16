import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const titles = {
    soup:    searchParams.get("soup")    ?? "—",
    main:    searchParams.get("main")    ?? "—",
    side:    searchParams.get("side")    ?? "—",
    dessert: searchParams.get("dessert") ?? "—",
  };

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const meals = [
    { emoji: "🥣",  label: "Çorba",          title: titles.soup },
    { emoji: "🍽️", label: "Ana Yemek",       title: titles.main },
    { emoji: "🥗",  label: "Yardımcı Lezzet", title: titles.side },
    { emoji: "🍮",  label: "Tatlı",           title: titles.dessert },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          background: "linear-gradient(135deg, #fdf6ec 0%, #fef3e2 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Decorative top accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#92400e",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          🍽️ Menü Günlüğü
        </div>
        <div
          style={{
            fontSize: 18,
            color: "#a16207",
            marginBottom: 52,
            display: "flex",
          }}
        >
          {dateStr}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#78350f",
            marginBottom: 44,
            display: "flex",
            letterSpacing: "-0.5px",
          }}
        >
          ✨ Günün Menüsü
        </div>

        {/* Meal rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 16,
          }}
        >
          {meals.map((meal) => (
            <div
              key={meal.label}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "22px 36px",
                background: "white",
                borderRadius: 20,
                border: "1.5px solid #fde68a",
                boxShadow: "0 2px 12px rgba(180,83,9,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  marginRight: 24,
                  display: "flex",
                  width: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {meal.emoji}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#d97706",
                    fontWeight: 700,
                    display: "flex",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {meal.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: "#1c1917",
                    fontWeight: 700,
                    display: "flex",
                  }}
                >
                  {meal.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 44,
            fontSize: 15,
            color: "#b45309",
            display: "flex",
            fontWeight: 500,
            letterSpacing: "0.5px",
          }}
        >
          menugunlugu.com
        </div>

        {/* Decorative bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #b45309 0%, #d97706 50%, #f59e0b 100%)",
            display: "flex",
          }}
        />
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
