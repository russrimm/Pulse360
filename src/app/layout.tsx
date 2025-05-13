import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Message Center',
  description: 'Stay informed about the latest updates and announcements from Microsoft 365.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Message Center
            </a>
            <ThemeToggle />
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
} 