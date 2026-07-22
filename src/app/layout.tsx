import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ThemeProvider } from 'next-themes'
import Navbar from '@/components/Navbar'
import { NavigationTabs } from '@/components/NavigationTabs'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import { FilterProvider } from '@/components/FilterContext'

import { Analytics } from "@vercel/analytics/next"
import { SafeSpeedInsights } from "@/components/SafeSpeedInsights"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Pulse 360°',
  description: 'Stay informed about Microsoft 365 service updates and changes',
  metadataBase: new URL('https://www.russrimmerman.com'),
  icons: {
    icon: '/siteicon.png',
    shortcut: '/siteicon.png',
    apple: '/siteicon.png',
  },
  other: {
    'apple-touch-icon': '/siteicon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark text-base" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/m365.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-black transition-colors duration-200`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <ErrorBoundary>
              <FilterProvider>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <NavigationTabs />
                  <main className="flex-1 flex flex-col min-h-0">
                    {children}
                  </main>
                  <Analytics />
                  <SafeSpeedInsights />
                </div>
              </FilterProvider>
            </ErrorBoundary>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 