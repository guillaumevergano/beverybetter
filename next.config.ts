import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations d'images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Logs en dev seulement
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
