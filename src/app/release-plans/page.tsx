import { getReleasePlans } from '@/lib/api';
import { ReleasePlansContent } from '@/components/ReleasePlansContent';

export default async function ReleasePlansPage() {
  const releasePlans = await getReleasePlans();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Release Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about upcoming Microsoft 365 features and changes
          </p>
        </div>
        <ReleasePlansContent releasePlans={releasePlans} />
      </div>
    </div>
  );
} 