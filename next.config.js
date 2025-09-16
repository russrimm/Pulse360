/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Next.js invoking eslint during build since we run it explicitly via npm scripts.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'devblogs.microsoft.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'winblogs.thesourcemediaassets.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;