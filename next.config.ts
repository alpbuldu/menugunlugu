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
      // Eski ?kategori=X URL'lerini /blog/kategori/X'e yönlendir (301)
      {
        source: "/blog",
        has: [{ type: "query", key: "kategori" }],
        destination: "/blog/kategori/:kategori",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
