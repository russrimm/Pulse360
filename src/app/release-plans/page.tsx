import { getReleasePlans } from '@/lib/api';
import { ReleasePlansContent } from '@/components/ReleasePlansContent';

export default async function ReleasePlansPage() {
  const releasePlans = await getReleasePlans();

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Stay informed about upcoming Microsoft 365 features and changes
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <ReleasePlansContent releasePlans={releasePlans} />
        </div>
      </div>
    </div>
  );
} 