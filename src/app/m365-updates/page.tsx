import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Microsoft 365 Updates (Moved) | Pulse 360',
  robots: { index: false }
};

export default function LegacyM365UpdatesRedirect() {
  redirect('/release-plans/m365');
}