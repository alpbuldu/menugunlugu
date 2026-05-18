import type { Metadata } from "next";
import AppDownloadClient from "./AppDownloadClient";

export const metadata: Metadata = {
  title: "Menü Günlüğü Uygulamasını İndir",
  description: "Her gün yeni menüler, yüzlerce tarif ve yemek topluluğu. Menü Günlüğü uygulamasını iOS ve Android için ücretsiz indir.",
  openGraph: {
    title: "Menü Günlüğü – Uygulamayı İndir",
    description: "Her gün yeni menüler, yüzlerce tarif. Ücretsiz indir.",
    url: "https://www.menugunlugu.com/indir",
    siteName: "Menü Günlüğü",
    images: [
      {
        url: "https://www.menugunlugu.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Menü Günlüğü",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Menü Günlüğü – Uygulamayı İndir",
    description: "Her gün yeni menüler, yüzlerce tarif. Ücretsiz indir.",
    images: ["https://www.menugunlugu.com/og-image.png"],
  },
};

export default function IndirPage() {
  return <AppDownloadClient />;
}
