import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Microsoft Security Response Center Updates | Pulse 360',
  description:
    'Monthly Microsoft Security Response Center vulnerability updates with CVE details, severity, and affected products.',
};

export default function MsrcLayout({ children }: { children: React.ReactNode }) {
  return children;
}
