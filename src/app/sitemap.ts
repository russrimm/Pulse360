import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.mspulse360.app';

const STATIC_ROUTES = [
  '',
  '/home',
  '/message-center',
  '/release-plans',
  '/product-news',
  '/azure-updates',
  '/m365-updates',
  '/fabric-roadmap',
  '/msrc',
  '/ms-lifecycle',
  '/security',
  '/about',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(route => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === '' || route === '/home' ? 'weekly' : 'daily',
    priority: route === '' || route === '/home' ? 1 : 0.8,
  }));
}
