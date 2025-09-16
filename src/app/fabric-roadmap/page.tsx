import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Microsoft Fabric Roadmap (Moved) | Pulse 360',
  robots: { index: false }
};

export default function LegacyFabricRoadmapRedirect() {
  redirect('/release-plans/fabric');
}