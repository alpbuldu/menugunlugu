import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/uye/panel", "/api/", "/giris", "/kayit"],
      },
    ],
    sitemap: "https://www.menugunlugu.com/sitemap.xml",
  };
}
