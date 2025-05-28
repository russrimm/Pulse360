'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProductNewsLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: string;
}

let products = [
  {
    name: 'Power Apps',
    icon: '/icons/PowerApps_scalable.svg',
    href: '/product-news',
  },
  {
    name: 'Power Automate',
    icon: '/icons/PowerAutomate_scalable.svg',
    href: '/product-news/power-automate',
  },
  {
    name: 'Power BI',
    icon: '/icons/PowerBI_scalable.svg',
    href: '/product-news/power-bi',
  },
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
  },
  {
    name: 'Copilot Studio',
    icon: '/icons/CopilotStudio_scalable.svg',
    href: '/product-news/copilot',
  },
  {
    name: 'Learn Blog',
    icon: '/icons/m365.svg',
    href: '/product-news/learn-blog',
  },
  {
    name: 'Microsoft News',
    icon: '/icons/Windows.svg',
    href: '/product-news/microsoft-news',
  },
  {
    name: 'Tech Community',
    icon: '/icons/techcommunity.svg',
    href: '/product-news/tech-community',
  },
  {
    name: 'Fabric',
    icon: '/icons/fabric_48_color.svg',
    href: '/product-news/fabric-blog',
  },
  {
    name: 'Semantic Kernel',
    icon: 'https://devblogs.microsoft.com/semantic-kernel/wp-content/uploads/sites/78/2024/10/Microsoft-favicon-48x48.jpg',
    href: 'https://devblogs.microsoft.com/semantic-kernel/feed/',
  },
  {
    name: 'Azure AI Foundry',
    icon: 'https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png',
    href: 'https://devblogs.microsoft.com/foundry/feed/',
  },
];

// Move 'Finance and Operations cross-app capabilities' to the end if present
const idx = products.findIndex(p => p.name === 'Finance and Operations cross-app capabilities')
if (idx !== -1) {
  const [item] = products.splice(idx, 1)
  products.push(item)
}

export function ProductNewsLayout({ children, title, description, icon }: ProductNewsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src={icon}
              alt={title}
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="mt-4 mb-2 w-full overflow-x-hidden">
          {/* Mobile: show all buttons in a single grid */}
          <div className="grid grid-cols-2 gap-3 w-full min-w-0 lg:hidden">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex flex-row items-center justify-start gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 h-10 min-h-[2.5rem] min-w-[120px] max-w-[160px] w-full flex-shrink-0
                  ${
                    pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                  }`}
              >
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
                <span className={`text-xs font-medium ${
                  pathname === product.href
                    ? 'text-primary-800 dark:text-primary-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                </span>
              </Link>
            ))}
          </div>
          {/* Desktop: force all buttons into a single horizontal row, shrink if needed */}
          <div className="hidden lg:flex flex-wrap gap-2 w-full pb-1">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] flex-shrink text-xs
                  ${
                    pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                  }`}
              >
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
                <span className={`text-xs font-medium ${
                  pathname === product.href
                    ? 'text-primary-800 dark:text-primary-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
} 