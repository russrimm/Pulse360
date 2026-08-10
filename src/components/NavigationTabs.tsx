'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface NavChild {
  name: string;
  href: string;
  icon: ReactNode;
}

interface NavItem {
  /** Short label shown in the rail so every destination fits one row. */
  name: string;
  /** Full label for assistive tech and tooltips. */
  fullName: string;
  href: string;
  icon: ReactNode;
  /** Pathname prefixes that mark this item active. */
  matches: string[];
  children?: NavChild[];
}

function productIcon(src: string) {
  return <Image src={src} alt="" width={20} height={20} className="h-5 w-5" />;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Home',
    fullName: 'Home',
    href: '/home',
    matches: ['/home'],
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
      </svg>
    ),
  },
  {
    name: 'Message Center',
    fullName: 'Microsoft 365 Message Center',
    href: '/message-center',
    matches: ['/message-center', '/message'],
    icon: productIcon('/icons/m365.svg'),
  },
  {
    name: 'Release Plans',
    fullName: 'Release Plans',
    href: '/release-plans',
    matches: ['/release-plans', '/release-plan', '/fabric-roadmap', '/azure-updates'],
    icon: productIcon('/icons/planner.svg'),
    children: [
      {
        name: 'Azure',
        href: '/release-plans/azure',
        icon: productIcon('/icons/Azure.svg'),
      },
      {
        name: 'Microsoft 365',
        href: '/release-plans/m365',
        icon: productIcon('/icons/m365.svg'),
      },
      {
        name: 'Dynamics 365 & Power Platform',
        href: '/release-plans/dynamics-power',
        icon: productIcon('/icons/PowerPlatform_scalable.svg'),
      },
      {
        name: 'Fabric',
        href: '/fabric-roadmap',
        icon: productIcon('/icons/fabric_48_color.svg'),
      },
    ],
  },
  {
    name: 'Product News',
    fullName: 'Product News',
    href: '/product-news',
    matches: ['/product-news'],
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
    ),
  },
  {
    name: 'Security',
    fullName: 'Microsoft Security',
    href: '/security',
    matches: ['/security', '/msrc'],
    icon: productIcon('/icons/defender.svg'),
    children: [
      {
        name: 'MSRC vulnerability updates',
        href: '/msrc',
        icon: productIcon('/icons/defender.svg'),
      },
    ],
  },
  {
    name: 'Lifecycle',
    fullName: 'Microsoft Support Lifecycle',
    href: '/ms-lifecycle',
    matches: ['/ms-lifecycle'],
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

const pillBase =
  'flex shrink-0 snap-start items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors';
const pillActive = 'bg-accent-soft text-accent-ink ring-1 ring-accent/30';
const pillIdle = 'text-ink-muted hover:bg-surface-sunken hover:text-ink';
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function isItemActive(item: NavItem, pathname: string): boolean {
  return item.matches.some(match => pathname === match || pathname.startsWith(`${match}/`));
}

export function NavigationTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="scrollbar-hide -mx-1 flex snap-x items-center gap-1 overflow-x-auto px-1 pb-2">
        {NAV_ITEMS.map(item => {
          const active = isItemActive(item, pathname);
          const children = item.children;

          if (!children) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.fullName}
                aria-label={item.fullName}
                aria-current={active ? 'page' : undefined}
                className={cn(pillBase, focusRing, active ? pillActive : pillIdle)}
              >
                <span className={active ? 'text-accent' : 'text-ink-subtle'}>{item.icon}</span>
                {item.name}
              </Link>
            );
          }

          return (
            <Popover.Root key={item.href}>
              <div className={cn(pillBase, 'pr-1.5', active ? pillActive : pillIdle)}>
                <Link
                  href={item.href}
                  title={item.fullName}
                  aria-label={item.fullName}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-2 rounded-full', focusRing)}
                >
                  <span className={active ? 'text-accent' : 'text-ink-subtle'}>{item.icon}</span>
                  {item.name}
                </Link>
                <Popover.Trigger
                  aria-label={`${item.fullName} sections`}
                  className={cn('rounded-full p-0.5 transition-colors hover:bg-accent/15', focusRing)}
                >
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </Popover.Trigger>
              </div>
              <Popover.Portal>
                <Popover.Content
                  sideOffset={10}
                  align="start"
                  collisionPadding={12}
                  className="animate-fadein z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-0.5 rounded-xl border border-line bg-surface-raised p-1.5 shadow-xl"
                >
                  {children.map(child => {
                    const childActive = pathname === child.href;
                    return (
                      <Popover.Close asChild key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={cn(
                            'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            focusRing,
                            childActive
                              ? 'bg-accent-soft text-accent-ink'
                              : 'text-ink hover:bg-surface-sunken'
                          )}
                        >
                          <span className="mt-0.5 shrink-0">{child.icon}</span>
                          <span className="min-w-0 break-words">{child.name}</span>
                        </Link>
                      </Popover.Close>
                    );
                  })}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          );
        })}
      </div>
    </nav>
  );
}
