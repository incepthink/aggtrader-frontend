import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        http2: false,
        child_process: false,
      };
    }
    return config;
  },
  // Add other Next.js config options here
  reactStrictMode: true,
};

export default nextConfig;