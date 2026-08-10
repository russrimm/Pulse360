import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Analytics } from '@vercel/analytics/next';
import { SafeSpeedInsights } from '@/components/SafeSpeedInsights';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: { default: 'Pulse 360°', template: '%s' },
  description:
    'Microsoft cloud news, roadmaps, lifecycle dates, security updates, and tenant Message Center changes.',
  metadataBase: new URL('https://www.mspulse360.app'),
  applicationName: 'Pulse 360',
  openGraph: {
    type: 'website',
    title: 'Pulse 360°',
    description: 'Track Microsoft cloud news, roadmaps, lifecycle dates, and security updates.',
    url: '/',
    siteName: 'Pulse 360',
  },
  twitter: {
    card: 'summary',
    title: 'Pulse 360°',
    description: 'Track Microsoft cloud news, roadmaps, lifecycle dates, and security updates.',
  },
  icons: {
    icon: '/siteicon.png',
    shortcut: '/siteicon.png',
    apple: '/siteicon.png',
  },
  other: { 'apple-touch-icon': '/siteicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="text-base" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/m365.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-canvas text-ink transition-colors duration-200 motion-reduce:transition-none`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-surface px-4 py-2 font-medium text-ink shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1 flex flex-col min-h-0">
              {children}
            </main>
            <SiteFooter />
            <Analytics />
            <SafeSpeedInsights />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
