import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        "pino-pretty": false,
      };
    }
    return config;
  },
  // Add any other Next.js config options you need
  experimental: {
    // Add experimental features if needed
  },
  images: {
    // Image configuration if needed
    domains: [],
  },
};

export default nextConfig;
