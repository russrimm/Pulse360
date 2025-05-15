import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Microsoft Pulse 360°',
  description: 'Stay informed about the latest updates and announcements from Microsoft.',
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

// Preload critical icons
const preloadIcons = [
  '/icons/m365.svg',
  '/icons/PowerApps_scalable.svg',
  '/icons/PowerAutomate_scalable.svg',
  '/icons/PowerPlatform_scalable.svg',
  '/icons/Dataverse_scalable.svg',
  '/icons/PowerBI_scalable.svg',
  '/icons/teams.svg',
  '/icons/sharepoint.svg',
  '/icons/onedrive.svg',
  '/icons/stream.svg',
  '/icons/exchange.svg',
  '/icons/forms.svg',
  '/icons/intune.svg',
  '/icons/planner.svg',
  '/icons/entra.svg',
  '/icons/Dynamics365_scalable.svg',
  '/icons/viva.svg',
  '/icons/purview.svg',
  '/icons/defender.svg',
  '/icons/Windows.svg'
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark text-base" suppressHydrationWarning>
      <head>
        {preloadIcons.map((icon) => (
          <link
            key={icon}
            rel="preload"
            href={icon}
            as="image"
            type="image/svg+xml"
          />
        ))}
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-900 dark:bg-black transition-colors duration-200`} suppressHydrationWarning>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:h-20 py-4 sm:py-0 items-center justify-end gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <a
                  href="mailto:russ.rimmerman@microsoft.com"
                  className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-center"
                >
                  A blog by Russ Rimmerman
                  <br />
                  Microsoft Cloud Solution Architect
                </a>
                <a
                  href="https://www.linkedin.com/in/russrimm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://github.com/russrimm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  )
} 