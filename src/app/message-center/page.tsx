import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MessageCenterClient from '@/components/MessageCenterClient';
import { FilterProvider } from '@/components/FilterContext';
import { getMessageCenterAccess } from '@/lib/message-center-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Microsoft 365 Message Center',
  description: 'Tenant-specific Microsoft 365 service updates and changes.',
  robots: { index: false, follow: false },
};

export default async function MessageCenterPage() {
  const access = await getMessageCenterAccess();
  if (access === 'unconfigured') {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center" role="alert">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Message Center unavailable
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Configure tenant sign-in before exposing Message Center data in production.
        </p>
      </section>
    );
  }
  if (access === 'authentication-required') {
    redirect('/api/auth/signin?callbackUrl=%2Fmessage-center');
  }

  return (
    <FilterProvider>
      <MessageCenterClient />
    </FilterProvider>
  );
}
