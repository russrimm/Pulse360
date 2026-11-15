/** @type {import('next').NextConfig} */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  // upgrade-insecure-requests is omitted: browsers ignore it (and log a console
  // error) when delivered in a report-only policy. Add it if the policy is enforced.
].join('; ');

const DYNAMICS_POWER_ROADMAP =
  '/release-plans/m365?family=Dynamics+365&family=Power+Platform+and+Dataverse';

const nextConfig = {
  // Standalone output is for the Azure App Service package. Vercel supplies its
  // own packaging and fails the build (missing next-server.js.nft.json) with it.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: '/', destination: '/home', permanent: false },
      { source: '/fabric-roadmap', destination: '/release-plans/fabric', permanent: true },
      { source: '/azure-updates', destination: '/release-plans/azure', permanent: true },
      { source: '/m365-updates', destination: '/release-plans/m365', permanent: true },
      { source: '/powerplatd365', destination: '/release-plans', permanent: true },
      // Dynamics 365, Power Platform, and Dataverse roadmap content moved into the
      // AI at Work roadmap (formerly the Microsoft 365 roadmap) in September 2026.
      {
        source: '/release-plans/dynamics-power',
        destination: DYNAMICS_POWER_ROADMAP,
        permanent: true,
      },
      {
        source: '/powerplatd365/release-plans',
        destination: DYNAMICS_POWER_ROADMAP,
        permanent: true,
      },
      {
        source: '/release-plans/roadmap',
        destination: DYNAMICS_POWER_ROADMAP,
        permanent: true,
      },
      // Old Release Planner item IDs (GUIDs) do not exist on the new roadmap.
      { source: '/release-plan/:id', destination: '/release-plans/m365', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicyReportOnly },
        ],
      },
    ];
  },
  images: {
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
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
