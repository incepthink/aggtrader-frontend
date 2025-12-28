import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        net: false,
        tls: false,
        fs: false,
        dns: false,
        http2: false,
        child_process: false,
      };

      // Handle node: protocol imports using NormalModuleReplacementPlugin
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: any) => {
            const mod = resource.request.replace(/^node:/, '');

            switch (mod) {
              case 'crypto':
                resource.request = 'crypto-browserify';
                break;
              case 'stream':
                resource.request = 'stream-browserify';
                break;
              case 'buffer':
                resource.request = 'buffer';
                break;
              default:
                throw new Error(`Not mapped: ${mod}`);
            }
          }
        )
      );

      // Provide global Buffer
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.smold.app',
        port: '',
        pathname: '/api/token/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.katana.network',
        port: '',
        pathname: '/icons/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sushi.com',
        port: '',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/coins/**',
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;