'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import React from 'react';

const PRODUCTS = [
  {
    label: 'Dynamics/Power Platform',
    href: '/release-plans/dynamics-power',
    icon: '/icons/PowerPlatform_scalable.svg',
  },
  {
    label: 'Fabric',
    href: '/fabric-roadmap',
    icon: '/icons/fabric_48_color.svg',
  },
];

export function NavigationTabs() {
  const pathname = usePathname();
  const [open365, setOpen365] = useState(false);
  const [openMSRC, setOpenMSRC] = useState(false);

  const handleOpenChange365 = useCallback((nextOpen: boolean) => setOpen365(nextOpen), [])
  const handleMenuItemClick365 = useCallback(() => setOpen365(false), [])
  const handleOpenChangeMSRC = useCallback((nextOpen: boolean) => setOpenMSRC(nextOpen), [])
  const handleMenuItemClickMSRC = useCallback(() => setOpenMSRC(false), [])

  const MICROSOFT_365_LINKS = [
    {
      name: 'Microsoft 365 Message Center',
      href: '/message-center',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Microsoft 365 Release Plans',
      href: '/release-plans/m365',
      icon: (
        <Image src="/icons/m365.svg" alt="Microsoft 365 Updates" width={20} height={20} className="w-5 h-5" />
      ),
    },
  ];

  const MSRC_LINKS = [
    {
      name: 'Microsoft Security Response Center Blog',
      href: '/msrc/blog',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
    {
      name: 'Microsoft Security Response Center Vulnerability Updates',
      href: '/msrc',
      icon: <Image src="/icons/defender.svg" alt="MSRC Updates" width={20} height={20} className="w-5 h-5" />,
    },
  ];

  // Add Release Planners dropdown with Azure as a child
  const RELEASE_PLANS_LINKS = [
    {
      name: 'Azure',
      href: '/release-plans/azure',
      icon: (
        <Image src="/icons/Azure.svg" alt="Azure Updates" width={20} height={20} className="w-5 h-5" />
      ),
    },
    {
      name: 'Microsoft 365',
      href: '/release-plans/m365',
      icon: (
        <Image src="/icons/m365.svg" alt="Microsoft 365" width={20} height={20} className="w-5 h-5" />
      ),
    },
    ...PRODUCTS.map(p => ({
      name: p.label,
      href: p.href,
      icon: <Image src={p.icon} alt={p.label} width={20} height={20} className="w-5 h-5" />,
    })),
  ];

  const tabs = [
    {
      name: 'Home',
      href: '/home',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
        </svg>
      ),
    },
    {
      name: 'M365 Message Center',
      href: '/message-center',
      icon: <Image src="/icons/m365.svg" alt="M365 Message Center" width={20} height={20} className="w-5 h-5" />,
    },
    {
      name: 'Release Plans',
      href: '/release-plans',
      icon: <Image src="/icons/planner.svg" alt="Release Plans" width={20} height={20} className="w-5 h-5" />, // Planner icon
      dropdown: true,
    },
    // Microsoft 365 Popover will be rendered here
    {
      name: 'Product News',
      href: '/product-news',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      name: 'Microsoft Security',
      href: '/msrc',
      icon: (
        <Image src="/icons/defender.svg" alt="Security Updates" width={20} height={20} className="w-5 h-5" />
      ),
      dropdown: true,
    },
  ];

  return (
    <div className="md:sticky md:top-16 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row flex-wrap justify-center gap-1.5 py-2 sm:gap-2">
          {tabs.map((tab, idx) => {
            // Highlight Product News tab for any /product-news subpath
            const isActive = tab.name === 'Product News'
              ? pathname === tab.href || pathname.startsWith('/product-news/')
              : pathname === tab.href;
            if (tab.name === 'Release Planner') return null;
            if (tab.name === 'Release Plans') {
              // Active if on the hub or any nested release-plans path
              const isActive = pathname === '/release-plans' || pathname.startsWith('/release-plans/');
              return (
                <Popover.Root key={tab.href}>
                  <Popover.Trigger asChild>
                    <button
                      className={`flex flex-col items-center justify-center md:flex-row md:items-center gap-1 md:gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative w-full md:w-auto text-center
                        ${isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                      aria-label="Release Plans"
                    >
                      <span className={`transition-transform duration-200 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>{tab.icon && tab.icon}</span>
                      <span className="text-center w-full md:w-auto">{tab.name}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content sideOffset={8} className="z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 min-w-[220px] flex flex-col gap-1 animate-fade-in">
                      {RELEASE_PLANS_LINKS.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-colors duration-150 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:bg-primary-100 dark:focus:bg-primary-800/40 ${link.href === pathname ? 'bg-primary-600 text-white pointer-events-none' : 'text-gray-900 dark:text-gray-100'}`}
                          aria-current={link.href === pathname ? 'page' : undefined}
                        >
                          {link.icon}
                          {link.name}
                        </Link>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              );
            }
            if (tab.name === 'Microsoft Security') {
              const isActive = MSRC_LINKS.some(link => pathname === link.href) || pathname === '/security' || pathname.startsWith('/security/');
              return (
                <Popover.Root key={tab.href} open={openMSRC} onOpenChange={handleOpenChangeMSRC}>
                  <Popover.Trigger asChild>
                    <button
                      className={`flex flex-col items-center justify-center md:flex-row md:items-center gap-1 md:gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative w-full md:w-auto text-center
                        ${isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
                      aria-label="Microsoft Security"
                    >
                      <span className={`transition-transform duration-200 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>{tab.icon}</span>
                      <span className="text-center w-full md:w-auto">{tab.name}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content sideOffset={8} className="z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 min-w-[220px] flex flex-col gap-1 animate-fade-in">
                      {MSRC_LINKS.map(link => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-colors duration-150 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:bg-primary-100 dark:focus:bg-primary-800/40 whitespace-normal break-words text-left ${link.href === pathname ? 'bg-primary-600 text-white pointer-events-none' : 'text-gray-900 dark:text-gray-100'}`}
                          aria-current={link.href === pathname ? 'page' : undefined}
                          onClick={handleMenuItemClickMSRC}
                        >
                          {link.icon}
                          <span className="whitespace-normal break-words text-left block w-full">{link.name}</span>
                        </Link>
                      ))}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              );
            }
            return (
              <React.Fragment key={tab.href}>
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center justify-center md:flex-row md:items-center gap-1 md:gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative w-full md:w-auto text-center
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <span className={`transition-transform duration-200 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>{tab.icon && tab.icon}</span>
                  <span className="text-center w-full md:w-auto">{tab.name}</span>
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
                </Link>
                {tab.name === 'Azure' && (
                  // Remove Azure as a top-level tab (now under Release Planners)
                  null
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
} 