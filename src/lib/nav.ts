/**
 * Single source of truth for the top-level site navigation. Adding a feature
 * means adding one entry to NAV_ITEMS; the desktop tab rail and the mobile
 * menu both render from it.
 *
 * Product News keeps its own sub-navigation in `src/lib/product-news.ts`; its
 * top-level entry here only needs the section root.
 */

export type NavIcon =
  | { kind: 'image'; src: string }
  | { kind: 'symbol'; name: 'home' | 'news' | 'calendar' };

export interface NavChild {
  name: string;
  href: string;
  icon: NavIcon;
}

export interface NavItem {
  /** Short label shown in the rail so every destination fits one row. */
  name: string;
  /** Full label for assistive tech and tooltips. */
  fullName: string;
  href: string;
  icon: NavIcon;
  /** Pathname prefixes that mark this item active. */
  matches: string[];
  children?: NavChild[];
}

function image(src: string): NavIcon {
  return { kind: 'image', src };
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: 'Home',
    fullName: 'Home',
    href: '/home',
    matches: ['/home'],
    icon: { kind: 'symbol', name: 'home' },
  },
  {
    name: 'Message Center',
    fullName: 'Microsoft 365 Message Center',
    href: '/message-center',
    matches: ['/message-center', '/message'],
    icon: image('/icons/m365.svg'),
  },
  {
    name: 'Service Health',
    fullName: 'Microsoft 365 Service Health',
    href: '/service-health',
    matches: ['/service-health'],
    icon: image('/icons/m365.svg'),
  },
  {
    name: 'Release Plans',
    fullName: 'Release Plans',
    href: '/release-plans',
    matches: ['/release-plans', '/release-plan', '/fabric-roadmap', '/azure-update', '/m365-update'],
    icon: image('/icons/planner.svg'),
    children: [
      { name: 'Azure', href: '/release-plans/azure', icon: image('/icons/Azure.svg') },
      { name: 'Microsoft 365', href: '/release-plans/m365', icon: image('/icons/m365.svg') },
      {
        name: 'Dynamics 365 & Power Platform',
        href: '/release-plans/dynamics-power',
        icon: image('/icons/PowerPlatform_scalable.svg'),
      },
      { name: 'Fabric', href: '/release-plans/fabric', icon: image('/icons/fabric_48_color.svg') },
    ],
  },
  {
    name: 'Product News',
    fullName: 'Product News',
    href: '/product-news',
    matches: ['/product-news'],
    icon: { kind: 'symbol', name: 'news' },
  },
  {
    name: 'Security',
    fullName: 'Microsoft Security',
    href: '/security',
    matches: ['/security', '/msrc'],
    icon: image('/icons/defender.svg'),
    children: [
      {
        name: 'MSRC vulnerability updates',
        href: '/msrc',
        icon: image('/icons/defender.svg'),
      },
    ],
  },
  {
    name: 'Lifecycle',
    fullName: 'Microsoft Support Lifecycle',
    href: '/ms-lifecycle',
    matches: ['/ms-lifecycle'],
    icon: { kind: 'symbol', name: 'calendar' },
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return item.matches.some(match => pathname === match || pathname.startsWith(`${match}/`));
}

export function findActiveNavItem(
  pathname: string,
  items: NavItem[] = NAV_ITEMS
): NavItem | undefined {
  return items.find(item => isNavItemActive(item, pathname));
}
