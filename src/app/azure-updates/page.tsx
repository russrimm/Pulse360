import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Azure Updates (Moved) | Pulse 360',
  robots: { index: false }
};

export default function AzureUpdatesLegacyRedirect() {
  redirect('/release-plans/azure');
}