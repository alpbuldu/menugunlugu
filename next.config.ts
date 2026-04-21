import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      // Blog: eski ?kategori=X → /blog/kategori/X
      {
        source: "/blog",
        has: [{ type: "query", key: "kategori" }],
        destination: "/blog/kategori/:kategori",
        permanent: true,
      },
      // Tarifler liste → /tarifler
      { source: "/recipes", destination: "/tarifler", permanent: true },
      // Tarifler kategori eski → yeni
      { source: "/recipes/kategori/corbalar",           destination: "/tarifler/kategori/corbalar",           permanent: true },
      { source: "/recipes/kategori/ana-yemekler",       destination: "/tarifler/kategori/ana-yemekler",       permanent: true },
      { source: "/recipes/kategori/yardimci-lezzetler", destination: "/tarifler/kategori/yardimci-lezzetler", permanent: true },
      { source: "/recipes/kategori/tatlilar",           destination: "/tarifler/kategori/tatlilar",           permanent: true },
      // Tarif detay eski slug
      { source: "/recipes/:slug", destination: "/tarifler/:slug", permanent: true },
      // Archive → Dünün Menüsü
      { source: "/archive", destination: "/dunun-menusu", permanent: true },
      // Menu → Günün Menüsü
      { source: "/menu", destination: "/gunun-menusu", permanent: true },
    ];
  },
};

export default nextConfig;
