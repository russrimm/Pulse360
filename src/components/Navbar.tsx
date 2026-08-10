'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const Navbar = () => {
  return (
    <nav aria-label="Primary">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="type-h2 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text whitespace-nowrap text-transparent dark:from-primary-400 dark:to-primary-300">
            Pulse 360&deg;
          </span>
          <span className="type-meta hidden truncate text-ink-subtle italic lg:inline">
            Stay ahead. Stay informed. Stay in control.
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <a
            href="https://www.linkedin.com/in/russrimm"
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClass}
            aria-label="Russ Rimmerman on LinkedIn"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
          <Link href="/about" className={iconButtonClass} aria-label="About Pulse 360">
            <Image
              src="/icons/azure/general/10005-icon-service-Information.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
