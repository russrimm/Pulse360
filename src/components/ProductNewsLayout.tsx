'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getMicrosoftNewsAuthors } from '@/lib/api.client';
import { cn } from '@/lib/cn';
import { PRODUCT_NEWS_GROUPS, findActiveProductNewsGroup } from '@/lib/product-news';

interface ProductNewsLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  icon: string | ReactNode;
}

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const tabBase =
  'flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors';
const tabActive = 'border-accent/40 bg-accent-soft text-accent-ink';
const tabIdle =
  'border-line bg-surface text-ink-muted hover:border-line-strong hover:bg-surface-sunken hover:text-ink';

export function MicrosoftMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className="shrink-0"
    >
      <path d="M11.5216 0.5H0V11.9067H11.5216V0.5Z" fill="#f25022"></path>
      <path d="M24.2418 0.5H12.7202V11.9067H24.2418V0.5Z" fill="#7fba00"></path>
      <path d="M11.5216 13.0933H0V24.5H11.5216V13.0933Z" fill="#00a4ef"></path>
      <path d="M24.2418 13.0933H12.7202V24.5H24.2418V13.0933Z" fill="#ffb900"></path>
    </svg>
  );
}

function decodeHtmlEntities(text: string) {
  if (!text) return '';
  const textarea = typeof window !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  // fallback for SSR: replace common entities
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function AuthorButton({ author, title, slug }: { author: string; title?: string; slug: string }) {
  const pathname = usePathname();
  if (!author || !author.trim()) return null;
  const isSelected = pathname === `/product-news/author/${slug}`;
  const isJudson = author
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .includes('judsonalthoff');
  return (
    <Link
      href={`/product-news/author/${slug}`}
      aria-current={isSelected ? 'page' : undefined}
      className={cn(
        'flex min-h-14 w-full flex-col items-center justify-center rounded-lg border px-2 py-1 text-xs transition-colors sm:w-[260px]',
        focusRing,
        isSelected ? `${tabActive} font-semibold` : tabIdle
      )}
    >
      <span className="flex w-full items-center justify-center gap-2 text-center font-medium leading-tight">
        {isJudson && (
          <Image
            src="/judsonalthoff.webp"
            alt="Judson Althoff"
            width={36}
            height={36}
            className="mr-1 shrink-0 rounded-full object-cover"
          />
        )}
        {decodeHtmlEntities(author)}
      </span>
      {title && (
        <span className="type-meta w-full break-words text-center leading-tight text-ink-subtle">
          {decodeHtmlEntities(title)}
        </span>
      )}
    </Link>
  );
}

function AuthorButtons() {
  const { data: authors } = useQuery({
    queryKey: ['microsoftNewsAuthors'],
    queryFn: getMicrosoftNewsAuthors,
  });
  if (!authors?.length) return null;

  return (
    <div className="my-4 flex w-full flex-wrap items-center gap-2 overflow-x-auto sm:flex-nowrap">
      {authors.map(({ name, title, slug }) => (
        <AuthorButton key={slug} author={name} title={title} slug={slug} />
      ))}
    </div>
  );
}

export function ProductNewsLayout({ children, title, description, icon }: ProductNewsLayoutProps) {
  const pathname = usePathname();
  const activeGroup = findActiveProductNewsGroup(pathname);
  const subFeeds = activeGroup && activeGroup.feeds.length > 1 ? activeGroup.feeds : null;
  const showAuthors =
    pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/');

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-2 flex flex-row items-center justify-center gap-3">
            {typeof icon === 'string' ? (
              <Image src={icon} alt="" width={32} height={32} className="h-8 w-8" />
            ) : (
              icon
            )}
            <h1 className="type-h1 text-ink">{title}</h1>
          </div>
          {description && <p className="type-body text-ink-muted">{description}</p>}
        </div>

        <nav aria-label="News sources" className="mb-4">
          <ul className="flex flex-wrap justify-center gap-2">
            {PRODUCT_NEWS_GROUPS.map(group => {
              const isActive = activeGroup?.id === group.id;
              return (
                <li key={group.id}>
                  <Link
                    href={group.href}
                    aria-current={pathname === group.href ? 'page' : undefined}
                    className={cn(tabBase, focusRing, isActive ? tabActive : tabIdle)}
                  >
                    {group.icon ? (
                      <Image
                        src={group.icon}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                      />
                    ) : (
                      <MicrosoftMark />
                    )}
                    {group.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {subFeeds ? (
          <nav aria-label={`${activeGroup?.label ?? ''} feeds`} className="mb-8">
            <ul className="mx-auto flex max-w-fit flex-wrap justify-center gap-2 rounded-xl border border-line bg-surface-sunken p-2">
              {subFeeds.map(feed => (
                <li key={feed.href}>
                  <Link
                    href={feed.href}
                    aria-current={pathname === feed.href ? 'page' : undefined}
                    className={cn(
                      'flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium transition-colors',
                      focusRing,
                      pathname === feed.href ? tabActive : tabIdle
                    )}
                  >
                    <Image
                      src={feed.icon}
                      alt=""
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5 object-contain"
                    />
                    {feed.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="mb-8" />
        )}

        {showAuthors && <AuthorButtons />}

        {children}
      </div>
    </div>
  );
}
