import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Legacy Release Plans Hub Redirect | Pulse 360',
  description: 'Redirecting to the consolidated Release Plans hub.'
};

export default function LegacyPowerPlatD365Redirect() {
  redirect('/release-plans');
}
