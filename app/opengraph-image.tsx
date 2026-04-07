import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "Menü Günlüğü";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          fontFamily: "serif",
        }}
      >
        {/* Dekoratif daire arka plan */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(228,160,64,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(184,101,21,0.08)",
            display: "flex",
          }}
        />

        {/* İkon */}
        <div style={{ fontSize: 100, marginBottom: 24, display: "flex" }}>
          🍽️
        </div>

        {/* Başlık */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#5c3221",
            letterSpacing: "-1px",
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
            marginTop: 16,
            fontWeight: 400,
            display: "flex",
          }}
        >
          Günlük Menüler · Tarifler · Blog
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 22,
            color: "#ce9660",
            display: "flex",
          }}
        >
          menugunlugu.com
        </div>
      </div>
    ),
    { ...size }
  );
}
