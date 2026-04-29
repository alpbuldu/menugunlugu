import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CookieBanner from "@/components/ui/CookieBanner";
import Chatbot from "@/components/Chatbot";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("logo_url")
    .eq("id", 1)
    .single();

  const logoUrl = data?.logo_url ?? null;

  return {
    metadataBase: new URL("https://www.menugunlugu.com"),
    title: {
      default: "Menü Günlüğü",
      template: "%s | Menü Günlüğü",
    },
    description: "Günlük menüler, tarifler ve daha fazlası.",
    icons: {
      icon:     "/api/favicon",
      shortcut: "/api/favicon",
      apple:    "/api/favicon",
    },
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
          strategy="lazyOnload"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8588576330436541"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script id="ga4-init" strategy="lazyOnload">
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
        <Chatbot />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
