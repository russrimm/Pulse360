import { getReleasePlans } from '@/lib/api';
import { ReleasePlansContent } from '@/components/ReleasePlansContent';
import Link from 'next/link'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDownIcon } from '@radix-ui/react-icons'

const PRODUCTS = [
  {
    label: 'Dynamics/Power Platform',
    href: '/release-plans',
    icon: '/icons/PowerPlatform_scalable.svg',
  },
  {
    label: 'Fabric',
    href: '/fabric-roadmap',
    icon: '/icons/Fabric.svg', // Use your Fabric icon path or fallback
  },
]

export default async function ReleasePlansPage() {
  const releasePlans = await getReleasePlans();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center mb-8 gap-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dynamics & Power Platform Roadmap
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Browse upcoming and shipped features from the Dynamics & Power Platform public roadmap.
            </p>
          </div>
        </div>
        <ReleasePlansContent releasePlans={releasePlans} />
      </div>
    </div>
  );
} 