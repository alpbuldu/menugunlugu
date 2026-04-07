import { ImageResponse } from "next/og";

export const runtime     = "edge";
export const alt         = "Menü Günlüğü";
export const size        = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont() {
  // Caveat Bold — okunabilir el yazısı, Google Fonts
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  ).then((r) => r.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(woff2|truetype|opentype)'\)/);
  if (!match) return null;
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OGImage() {
  const fontData = await loadFont().catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf8f0 0%, #faefd8 60%, #f4daa8 100%)",
        }}
      >
        {/* Dekoratif daireler */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 500, height: 500, borderRadius: "50%", background: "rgba(228,160,64,0.12)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(184,101,21,0.08)", display: "flex" }} />

        {/* Emoji */}
        <div style={{ fontSize: 100, marginBottom: 20, display: "flex" }}>🍽️</div>

        {/* Başlık — el yazısı */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: "#5c3221",
            fontFamily: fontData ? "Caveat" : "serif",
            letterSpacing: "1px",
            display: "flex",
          }}
        >
          Menü Günlüğü
        </div>

        {/* Alt yazı */}
        <div
          style={{
            fontSize: 30,
            color: "#a85e30",
            marginTop: 14,
            fontWeight: 400,
            fontFamily: "sans-serif",
            display: "flex",
          }}
        >
          Günlük Menüler · Tarifler · Blog
        </div>

        {/* Domain */}
        <div style={{ position: "absolute", bottom: 40, fontSize: 22, color: "#ce9660", fontFamily: "sans-serif", display: "flex" }}>
          menugunlugu.com
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? { fonts: [{ name: "Caveat", data: fontData, style: "normal", weight: 700 }] }
        : {}),
    }
  );
}
