import { Suspense } from 'react';
import { MsLifecycleClient } from '@/components/MsLifecycleClient';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const metadata = {
  title: 'Microsoft Lifecycle | Pulse 360',
  description: 'Microsoft product lifecycle end-of-support and retirement dates',
};

export default function MsLifecyclePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Microsoft Product Lifecycle</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          End-of-support and retirement dates sourced from the{' '}
          <a
            href="https://learn.microsoft.com/en-us/lifecycle/products/export/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline hover:no-underline"
          >
            Microsoft Lifecycle export
          </a>
          .
        </p>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <MsLifecycleClient />
      </Suspense>
    </div>
  );
}
