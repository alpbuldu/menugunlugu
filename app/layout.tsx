import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CookieBanner from "@/components/ui/CookieBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("favicon_url, logo_url")
    .eq("id", 1)
    .single();

  const faviconUrl = data?.favicon_url ?? null;
  const logoUrl    = data?.logo_url    ?? null;

  return {
    metadataBase: new URL("https://www.menugunlugu.com"),
    title: {
      default: "Menü Günlüğü",
      template: "%s | Menü Günlüğü",
    },
    description: "Günlük menüler, tarifler ve daha fazlası.",
    ...(faviconUrl && {
      icons: {
        icon:     faviconUrl,
        shortcut: faviconUrl,
        apple:    faviconUrl,
      },
    }),
    openGraph: {
      siteName: "Menü Günlüğü",
      locale:   "tr_TR",
      type:     "website",
      ...(logoUrl && { images: [{ url: logoUrl, width: 1200, height: 1200 }] }),
    },
    other: {
      "google-adsense-account": "ca-pub-8588576330436541",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-69LK11MP4Q"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8588576330436541"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-69LK11MP4Q');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
        <CookieBanner />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
