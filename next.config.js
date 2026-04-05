const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sgisjvvfhwzvhtumrrnk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
