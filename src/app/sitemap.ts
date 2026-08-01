import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.mspulse360.app';

const STATIC_ROUTES = [
  '',
  '/home',
  '/release-plans',
  '/release-plans/azure',
  '/release-plans/m365',
  '/release-plans/fabric',
  '/release-plans/dynamics-power',
  '/product-news',
  '/product-news/power-platform',
  '/product-news/power-automate',
  '/product-news/power-bi',
  '/product-news/copilot',
  '/product-news/copilot-studio',
  '/product-news/microsoft-news',
  '/product-news/tech-community',
  '/product-news/azure-ai-foundry',
  '/product-news/azure-ai-ml',
  '/product-news/all-things-azure',
  '/product-news/semantic-kernel',
  '/product-news/fabric-blog',
  '/product-news/vscode',
  '/product-news/windows',
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
