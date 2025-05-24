import { getReleasePlans } from '@/lib/api';
import { ReleasePlansContent } from '@/components/ReleasePlansContent';
import { ReleasePlannerAgentChat } from '@/components/ReleasePlannerAgentChat'

export default async function ReleasePlansPage() {
  const releasePlans = await getReleasePlans();
  const connectionString = process.env.NEXT_PUBLIC_COPILOT_CONNECTION_STRING as string;
  const endpoint = 'https://18571ae92db1e2fc97ef2398a6944c.06.environment.api.powerplatform.com/copilotstudio/dataverse-backed/authenticated/bots/cr7d6_agent/conversations?api-version=2022-03-01-preview';

  return (
    <div className="min-h-screen">
      <ReleasePlannerAgentChat />
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
        </div>
        <ReleasePlansContent releasePlans={releasePlans} />
      </div>
    </div>
  );
} 