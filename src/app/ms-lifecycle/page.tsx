import { Suspense } from 'react';
import { MsLifecycleClient } from '@/components/MsLifecycleClient';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const metadata = {
  title: 'Microsoft Support Lifecycle | Pulse 360',
  description: 'Microsoft product lifecycle and Azure feature retirement dates',
};

export default function MsLifecyclePage() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-[110rem] flex-1 flex-col px-4 py-4 sm:px-6 md:h-[calc(100dvh-var(--app-header-h,6.5rem))] md:flex-none md:overflow-hidden lg:px-8">
      <header className="mb-2 shrink-0 text-center">
        <h1 className="type-h1 text-ink">Microsoft Support Lifecycle</h1>
      </header>
      <Suspense fallback={<LoadingSpinner />}>
        <MsLifecycleClient />
      </Suspense>
    </div>
  );
}
