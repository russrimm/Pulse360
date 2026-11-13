import type { Metadata } from 'next';

export interface ProductNewsFeed {
  /** Route path, also the unique id. */
  href: string;
  /** Short label for navigation. */
  label: string;
  /** Page heading. */
  title: string;
  description: string;
  icon: string;
}

export interface ProductNewsGroup {
  id: string;
  label: string;
  /** Icon for the top-level tab; omit to use the Microsoft four-square mark. */
  icon?: string;
  /** Where the top-level tab links. */
  href: string;
  feeds: ProductNewsFeed[];
  /** Extra path prefixes that belong to this group (for example author pages). */
  extraPrefixes?: string[];
}

const FOUNDRY_ICON =
  'https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png';
const WINDOWS_ICON =
  'https://winblogs.thesourcemediaassets.com/2022/09/cropped-Windows11IconTransparent512-32x32.png';

/**
 * Single source of truth for Product News navigation and page titles. Adding a
 * feed here updates the tab rail, the sub-navigation, active states, and (via
 * `productNewsMetadata`) the document title.
 */
export const PRODUCT_NEWS_GROUPS: ProductNewsGroup[] = [
  {
    id: 'power-platform',
    label: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
    feeds: [
      {
        href: '/product-news',
        label: 'Power Apps',
        title: 'Power Apps News',
        description:
          'Stay up to date with the latest news and announcements from Microsoft Power Apps.',
        icon: '/icons/PowerApps_scalable.svg',
      },
      {
        href: '/product-news/power-automate',
        label: 'Power Automate',
        title: 'Power Automate News',
        description:
          'Stay up to date with the latest news and announcements from Microsoft Power Automate.',
        icon: '/icons/PowerAutomate_scalable.svg',
      },
      {
        href: '/product-news/copilot-studio',
        label: 'Copilot Studio',
        title: 'Copilot Studio News',
        description:
          'Stay up to date with the latest news and announcements from Microsoft Copilot Studio.',
        icon: '/icons/CopilotStudio_scalable.svg',
      },
      {
        href: '/product-news/copilot',
        label: 'Copilot',
        title: 'Copilot News',
        description:
          'Stay up to date with the latest news and announcements from the Microsoft Copilot blog.',
        icon: '/icons/Copilot_scalable.svg',
      },
      {
        href: '/product-news/power-platform',
        label: 'Power Platform',
        title: 'Power Platform News',
        description:
          'Stay up to date with the latest news and announcements from Microsoft Power Platform.',
        icon: '/icons/PowerPlatform_scalable.svg',
      },
    ],
  },
  {
    id: 'microsoft-news',
    label: 'Microsoft News',
    href: '/product-news/microsoft-news',
    feeds: [
      {
        href: '/product-news/microsoft-news',
        label: 'Microsoft News',
        title: 'Microsoft News',
        description: 'Latest posts from the official Microsoft blog.',
        icon: '/icons/m365.svg',
      },
    ],
    extraPrefixes: ['/product-news/author/'],
  },
  {
    id: 'azure-ai-ml',
    label: 'AI + Machine Learning',
    icon: '/icons/azure/ai + machine learning/00028-icon-service-Batch-AI.svg',
    href: '/product-news/azure-ai-ml',
    feeds: [
      {
        href: '/product-news/azure-ai-ml',
        label: 'AI + Machine Learning',
        title: 'Azure AI + Machine Learning',
        description:
          'Stay up to date with the latest news and announcements from Azure AI and Machine Learning services.',
        icon: '/icons/azure/ai + machine learning/00028-icon-service-Batch-AI.svg',
      },
    ],
  },
  {
    id: 'tech-community',
    label: 'Tech Community',
    icon: '/icons/techcommunity.svg',
    href: '/product-news/tech-community',
    feeds: [
      {
        href: '/product-news/tech-community',
        label: 'Tech Community',
        title: 'Tech Community',
        description: 'Latest posts from the Microsoft Tech Community blogs.',
        icon: '/icons/techcommunity.svg',
      },
    ],
  },
  {
    id: 'fabric',
    label: 'Fabric',
    icon: '/icons/fabric_48_color.svg',
    href: '/product-news/fabric-blog',
    feeds: [
      {
        href: '/product-news/fabric-blog',
        label: 'Fabric',
        title: 'Fabric Blog News',
        description: 'Latest updates from the Fabric Blog.',
        icon: '/icons/fabric_48_color.svg',
      },
      {
        href: '/product-news/power-bi',
        label: 'Power BI',
        title: 'Power BI News',
        description: 'Stay up to date with the latest news and announcements from Power BI.',
        icon: '/icons/PowerBI_scalable.svg',
      },
    ],
  },
  {
    id: 'dev-blogs',
    label: 'Dev Blogs',
    icon: '/icons/azure/devops/10261-icon-service-Azure-DevOps.svg',
    href: '/product-news/azure-ai-foundry',
    feeds: [
      {
        href: '/product-news/azure-ai-foundry',
        label: 'Azure AI Foundry',
        title: 'Azure AI Foundry',
        description: 'Latest updates from the Azure AI Foundry team.',
        icon: FOUNDRY_ICON,
      },
      {
        href: '/product-news/all-things-azure',
        label: 'All Things Azure',
        title: 'All Things Azure',
        description: 'Latest posts from the All Things Azure blog.',
        icon: '/icons/Azure.svg',
      },
      {
        href: '/product-news/semantic-kernel',
        label: 'Semantic Kernel',
        title: 'Semantic Kernel',
        description: 'Latest updates from the Semantic Kernel team.',
        icon: '/icons/sklogo.svg',
      },
      {
        href: '/product-news/vscode',
        label: 'VS Code',
        title: 'VS Code',
        description: 'Latest updates from the Visual Studio Code team.',
        icon: '/icons/azure/devops/VisualStudioCode.svg',
      },
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    icon: WINDOWS_ICON,
    href: '/product-news/windows',
    feeds: [
      {
        href: '/product-news/windows',
        label: 'Windows',
        title: 'Windows',
        description: 'Latest updates from the Windows Blog.',
        icon: WINDOWS_ICON,
      },
    ],
  },
];

export function findProductNewsFeed(href: string): ProductNewsFeed | undefined {
  for (const group of PRODUCT_NEWS_GROUPS) {
    const feed = group.feeds.find(candidate => candidate.href === href);
    if (feed) return feed;
  }
  return undefined;
}

export function getProductNewsFeed(href: string): ProductNewsFeed {
  const feed = findProductNewsFeed(href);
  if (!feed) throw new Error(`Unknown product news feed: ${href}`);
  return feed;
}

export function findActiveProductNewsGroup(pathname: string): ProductNewsGroup | undefined {
  return PRODUCT_NEWS_GROUPS.find(
    group =>
      group.feeds.some(feed => feed.href === pathname) ||
      group.extraPrefixes?.some(prefix => pathname.startsWith(prefix))
  );
}

/** Per-route metadata so every feed gets a distinct document title. */
export function productNewsMetadata(href: string): Metadata {
  const feed = findProductNewsFeed(href);
  if (!feed) return { title: 'Product News | Pulse 360' };
  return { title: `${feed.title} | Pulse 360`, description: feed.description };
}
