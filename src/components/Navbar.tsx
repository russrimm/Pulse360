import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 md:static">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/icons/m365.svg"
                alt="Microsoft 365"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Message Center
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/about'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
            >
              About
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === '/'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link
            href="/about"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === '/about'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs mt-1">About</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 