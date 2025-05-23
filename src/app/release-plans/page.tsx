import { getReleasePlans } from '@/lib/api';
import { ReleasePlansContent } from '@/components/ReleasePlansContent';

export default async function ReleasePlansPage() {
  const releasePlans = await getReleasePlans();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Release Planner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay informed about upcoming Microsoft 365 features and changes
            </p>
          </div>
          <div className="hidden lg:block sticky top-24 z-30" style={{ width: 340, height: 320 }}>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm w-full h-full flex items-center justify-center">
              <iframe
                src="https://copilotstudio.preview.microsoft.com/environments/18571ae9-2db1-e2fc-97ef-2398a6944c06/bots/cr7d6_agent/webchat?__version__=2"
                frameBorder="0"
                style={{ width: '100%', height: '100%' }}
                title="Copilot Studio Agent Chat"
                allow="clipboard-write;"
              />
            </div>
          </div>
        </div>
        <ReleasePlansContent releasePlans={releasePlans} />
      </div>
    </div>
  );
} 