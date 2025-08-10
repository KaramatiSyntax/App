// next.config.mjs
import createPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js'; // default caching strategy

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'iili.io' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'example.com' },
      { protocol: 'https', hostname: 'freeimage.host' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cloudinary.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  serverExternalPackages: ['mongoose'],
  experimental: {
    turbo: false, // disable turbopack
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

// 👇 Final export with PWA wrapper (disabled in dev)
const withPWA = createPWA({
  dest: 'public',
  disable: isDev,      // Prevent cache bloat in development
  register: true,
  skipWaiting: true,
  runtimeCaching,      // Uses default safe caching
});

export default withPWA(nextConfig);
