import { getCopilotStudioNews } from '@/lib/api';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Copilot Studio News | MCViewer',
  description: 'Stay up to date with the latest news and announcements from Microsoft Copilot Studio.',
};

const products = [
  {
    name: 'Power Apps',
    icon: '/icons/PowerApps_scalable.svg',
    href: '/product-news',
    current: false
  },
  {
    name: 'Power Automate',
    icon: '/icons/PowerAutomate_scalable.svg',
    href: '/product-news/power-automate',
    current: false
  },
  {
    name: 'Power BI',
    icon: '/icons/PowerBI_scalable.svg',
    href: '/product-news/power-bi',
    current: false
  },
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
    current: false
  },
  {
    name: 'Copilot Studio',
    icon: '/icons/CopilotStudio_scalable.svg',
    href: '/product-news/copilot-studio',
    current: true
  }
];

export default async function CopilotStudioNewsPage() {
  const news = await getCopilotStudioNews();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Copilot Studio News
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay up to date with the latest news and announcements from Microsoft Copilot Studio.
          </p>
        </div>

        <div className="mt-8 mb-6">
          <div className="flex flex-wrap gap-4">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  product.current
                    ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800'
                    : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                }`}
              >
                <Image
                  src={product.icon}
                  alt={product.name}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className={`text-sm font-medium ${
                  product.current
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <ProductNewsCard 
              key={item.id} 
              news={item} 
              productIcon="/icons/CopilotStudio_scalable.svg"
            />
          ))}
        </div>
      </div>
    </div>
  );
} 