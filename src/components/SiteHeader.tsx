'use client';

import { useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { NavigationTabs } from './NavigationTabs';

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  // Publish the rendered header height so page-level sticky bars can offset
  // against the real value instead of a hardcoded guess.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const applyHeight = () => {
      const { height } = header.getBoundingClientRect();
      document.documentElement.style.setProperty('--app-header-h', `${Math.round(height)}px`);
    };

    applyHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', applyHeight);
      return () => window.removeEventListener('resize', applyHeight);
    }

    const observer = new ResizeObserver(applyHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-md"
    >
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 dark:from-primary-500 dark:via-primary-300 dark:to-primary-500"
      />
      <Navbar />
      <NavigationTabs />
    </header>
  );
}
