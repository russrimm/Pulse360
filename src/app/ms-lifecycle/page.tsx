import { Suspense } from 'react';
import { MsLifecycleClient } from '@/components/MsLifecycleClient';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const metadata = {
  title: 'Microsoft Support Lifecycle | Pulse 360',
  description: 'Microsoft product lifecycle and Azure feature retirement dates',
};

export default function MsLifecyclePage() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 md:h-[calc(100dvh-8rem)] md:flex-none md:overflow-hidden lg:px-8">
      <header className="mb-2 shrink-0 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Microsoft Support Lifecycle</h1>
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <MsLifecycleClient />
      </Suspense>
    </div>
  );
}
