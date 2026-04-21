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
      // Tarifler: eski ?category=soup/main/side/dessert → Türkçe slug
      { source: "/recipes", has: [{ type: "query", key: "category", value: "soup"    }], destination: "/recipes/kategori/corbalar",           permanent: true },
      { source: "/recipes", has: [{ type: "query", key: "category", value: "main"    }], destination: "/recipes/kategori/ana-yemekler",       permanent: true },
      { source: "/recipes", has: [{ type: "query", key: "category", value: "side"    }], destination: "/recipes/kategori/yardimci-lezzetler", permanent: true },
      { source: "/recipes", has: [{ type: "query", key: "category", value: "dessert" }], destination: "/recipes/kategori/tatlilar",           permanent: true },
    ];
  },
};

export default nextConfig;
