'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface ProductNewsLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  icon: string | ReactNode;
}

let products = [
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
  },
  {
    name: 'Microsoft News',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" width={16} height={16} style={{display:'inline-block'}}>
        <path d="M11.5216 0.5H0V11.9067H11.5216V0.5Z" fill="#f25022"></path>
        <path d="M24.2418 0.5H12.7202V11.9067H24.2418V0.5Z" fill="#7fba00"></path>
        <path d="M11.5216 13.0933H0V24.5H11.5216V13.0933Z" fill="#00a4ef"></path>
        <path d="M24.2418 13.0933H12.7202V24.5H24.2418V13.0933Z" fill="#ffb900"></path>
      </svg>
    ),
    href: '/product-news/microsoft-news',
  },
  {
    name: 'AI + Machine Learning',
    icon: '/icons/azure/ai + machine learning/00028-icon-service-Batch-AI.svg',
    href: '/product-news/azure-ai-ml',
  },
  {
    name: 'Tech Community',
    icon: '/icons/techcommunity.svg',
    href: '/product-news/tech-community',
  },
  {
    name: 'Fabric',
    icon: '/icons/fabric_48_color.svg',
    href: '/product-news/fabric-blog',
  },
  {
    name: 'Dev Blogs',
    icon: '/icons/azure/devops/10261-icon-service-Azure-DevOps.svg',
    href: '/product-news/azure-ai-foundry',
  },
  {
    name: 'Windows',
    icon: 'https://winblogs.thesourcemediaassets.com/2022/09/cropped-Windows11IconTransparent512-32x32.png',
    href: '/product-news/windows',
  },
];

// Move 'Finance and Operations cross-app capabilities' to the end if present
const idx = products.findIndex(p => p.name === 'Finance and Operations cross-app capabilities')
if (idx !== -1) {
  const [item] = products.splice(idx, 1)
  products.push(item)
}

function getAuthorSlug(author: string) {
  if (!author) return ''
  return author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Only show author name, no title fetch
function AuthorWithTitle({ author }: { author: string }) {
  const slug = getAuthorSlug(author)
  const authorUrl = `https://blogs.microsoft.com/blog/author/${slug}/`
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
      Published by{' '}
      <a href={authorUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-700">
        {author}
      </a>
    </p>
  )
}

interface AuthorObj { name: string; title: string; slug: string }
function AuthorButtons() {
  const [authors, setAuthors] = useState<AuthorObj[] | null>(null)
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const res = await fetch('/api/microsoft-news-authors')
        const authors = await res.json()
        setAuthors(authors)
      } catch {
        setAuthors([])
      }
    }
    fetchAuthors()
  }, [])
  if (!authors) return null
  if (authors.length === 0) return null

  return (
    <div className="w-full flex flex-wrap gap-2 my-4 items-center overflow-x-auto justify-start sm:flex-nowrap">
      {authors.map(({ name, title, slug }) => (
        <AuthorButton key={slug} author={name} title={title} slug={slug} />
      ))}
    </div>
  )
}

function decodeHtmlEntities(text: string) {
  if (!text) return ''
  const textarea = typeof window !== 'undefined' ? document.createElement('textarea') : null
  if (textarea) {
    textarea.innerHTML = text
    return textarea.value
  }
  // fallback for SSR: replace common entities
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function AuthorButton({ author, title, slug }: { author: string; title?: string; slug: string }) {
  if (!author || !author.trim()) return null
  const pathname = usePathname()
  const isSelected = pathname === `/product-news/author/${slug}`
  const isCorp = author === 'Microsoft Corporate'
  const isJudson = author.toLowerCase().replace(/[^a-z]/g, '').includes('judsonalthoff')
  return (
    <Link
      href={`/product-news/author/${slug}`}
      className={`flex flex-col items-center justify-center gap-0 px-2 py-1 rounded-lg border transition-all duration-200 h-auto min-h-[56px] text-xs whitespace-normal sm:w-[260px] w-full
        ${isSelected
          ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800 text-primary-800 dark:text-primary-200 font-semibold'
          : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-white'}
      `}
    >
      <span className="w-full text-center font-medium leading-tight block flex items-center justify-center gap-2">
        {isJudson && (
          <Image src="/judsonalthoff.webp" alt="Judson Althoff" width={36} height={36} className="rounded-full object-cover shrink-0 mr-1" />
        )}
        {decodeHtmlEntities(author)}
      </span>
      {title && <span className="w-full text-center block text-[10px] text-gray-600 dark:text-gray-300 leading-tight break-words whitespace-normal">{decodeHtmlEntities(title)}</span>}
    </Link>
  )
}

const powerPlatformPaths = [
  '/product-news',
  '/product-news/power-platform',
  '/product-news/power-automate',
  '/product-news/copilot',
]

const fabricPaths = [
  '/product-news/fabric-blog',
  '/product-news/power-bi',
]

export function ProductNewsLayout({ children, title, description, icon }: ProductNewsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="flex flex-row items-center gap-3 mb-2 justify-center">
            {typeof icon === 'string' ? (
              <Image
                src={icon}
                alt={typeof title === 'string' ? title : ''}
                width={32}
                height={32}
                className="w-8 h-8"
              />
            ) : (
              icon
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="mt-8 mb-2 w-full overflow-x-hidden">
          {/* Add improved button outlines for light mode */}
          <style jsx global>{`
            /* Product news buttons (mobile and desktop) */
            .grid.grid-cols-2 a,
            .lg\:flex.flex-wrap a {
              border: 2px solid #94a3b8 !important; /* gray-400 */
              background: #fff;
              transition: border-color 0.2s, box-shadow 0.2s;
            }
            .dark .grid.grid-cols-2 a,
            .dark .lg\:flex.flex-wrap a {
              background: #18181b !important; /* gray-900 */
              border-color: #374151 !important; /* gray-700 */
            }
            .grid.grid-cols-2 a:hover,
            .lg\:flex.flex-wrap a:hover {
              border-color: #38bdf8 !important; /* primary-400 */
              box-shadow: 0 2px 8px 0 rgba(59,130,246,0.10);
            }
            .dark .grid.grid-cols-2 a:hover,
            .dark .lg\:flex.flex-wrap a:hover {
              border-color: #38bdf8 !important;
            }
            .grid.grid-cols-2 a[aria-current="page"],
            .lg\:flex.flex-wrap a[aria-current="page"],
            .grid.grid-cols-2 a.bg-primary-50,
            .lg\:flex.flex-wrap a.bg-primary-50 {
              border-color: #0ea5e9 !important; /* primary-500 */
              box-shadow: 0 4px 24px 0 rgba(59,130,246,0.18);
            }
            .dark .grid.grid-cols-2 a[aria-current="page"],
            .dark .lg\:flex.flex-wrap a[aria-current="page"],
            .dark .grid.grid-cols-2 a.bg-primary-50,
            .dark .lg\:flex.flex-wrap a.bg-primary-50 {
              border-color: #38bdf8 !important;
            }
            .grid.grid-cols-2 a:focus,
            .lg\:flex.flex-wrap a:focus {
              border-color: #38bdf8 !important;
              box-shadow: 0 0 0 3px #bae6fd;
              outline: none;
            }
            .dark .grid.grid-cols-2 a:focus,
            .dark .lg\:flex.flex-wrap a:focus {
              border-color: #38bdf8 !important;
              box-shadow: 0 0 0 3px #0ea5e9;
            }
          `}</style>
          {/* Mobile: show all buttons in a 2x4 grid */}
          <div className={`grid grid-cols-2 gap-3 w-full min-w-0 lg:hidden justify-center mb-8${!['/product-news/power-platform','/product-news/power-automate','/product-news/copilot','/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/fabric-blog','/product-news/power-bi','/product-news/vscode','/product-news/azure-ai-ml','/product-news'].includes(pathname) ? ' mb-12' : ''}`}>
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex flex-row items-center justify-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 h-10 w-full hover:bg-primary-50/80 active:scale-95 transition-all
                  ${
                    (product.href === '/product-news/microsoft-news' && (pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')))
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname))
                        ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                        : (product.href === '/product-news/power-platform' && powerPlatformPaths.includes(pathname))
                          ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                          : (product.href === '/product-news/fabric-blog' && fabricPaths.includes(pathname))
                            ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                            : pathname === product.href
                              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                              : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                  }`}
              >
                {product.icon && typeof product.icon === 'string' && product.icon !== '' ? (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                ) : product.icon}
                <span className={`text-xs font-medium ${
                  pathname === product.href
                    ? 'text-primary-800 dark:text-primary-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                </span>
              </Link>
            ))}
          </div>
          {/* Desktop: split buttons into two rows for better layout */}
          <div className={`hidden lg:block w-full pb-1 mb-10${!['/product-news/power-platform','/product-news/power-automate','/product-news/copilot','/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/fabric-blog','/product-news/power-bi','/product-news/vscode','/product-news/azure-ai-ml','/product-news'].includes(pathname) ? ' mb-12' : ''}`}>
            {/* First row - main categories */}
            <div className="flex gap-2 w-full justify-center mb-2">
              {products.slice(0, 4).map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] flex-shrink text-xs hover:bg-primary-50/80 active:scale-95 transition-all
                  ${
                    (product.href === '/product-news/microsoft-news' && (pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')))
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                        : (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname))
                          ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                          : (product.href === '/product-news/power-platform' && powerPlatformPaths.includes(pathname))
                            ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                            : (product.href === '/product-news/fabric-blog' && fabricPaths.includes(pathname))
                              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                            : pathname === product.href
                              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                              : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                  }`}
              >
                {product.icon && typeof product.icon === 'string' && product.icon !== '' ? (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                ) : product.icon}
                <span className={`text-xs font-medium ${
                  pathname === product.href
                    ? 'text-primary-800 dark:text-primary-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                    {/* Show chevron for parent buttons with active children */}
                    {((product.href === '/product-news/power-platform' && powerPlatformPaths.includes(pathname)) ||
                      (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname)) ||
                      (product.href === '/product-news/fabric-blog' && fabricPaths.includes(pathname))) && (
                      <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                </span>
              </Link>
            ))}
          </div>
            {/* Second row - remaining categories */}
            <div className="flex gap-2 w-full justify-center">
              {products.slice(4).map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] flex-shrink text-xs hover:bg-primary-50/80 active:scale-95 transition-all
                    ${
                      (product.href === '/product-news/microsoft-news' && (pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')))
                        ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                        : (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname))
                          ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                          : (product.href === '/product-news/power-platform' && powerPlatformPaths.includes(pathname))
                            ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                            : (product.href === '/product-news/fabric-blog' && fabricPaths.includes(pathname))
                              ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                              : pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                    }`}
                >
                  {product.icon && typeof product.icon === 'string' && product.icon !== '' ? (
                    <Image
                      src={product.icon}
                      alt={product.name}
                      width={16}
                      height={16}
                      className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                    />
                  ) : product.icon}
                  <span className={`text-xs font-medium ${
                    pathname === product.href
                      ? 'text-primary-800 dark:text-primary-200 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {product.name}
                    {/* Show chevron for parent buttons with active children */}
                    {((product.href === '/product-news/power-platform' && powerPlatformPaths.includes(pathname)) ||
                      (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname)) ||
                      (product.href === '/product-news/fabric-blog' && fabricPaths.includes(pathname))) && (
                      <svg className="w-3 h-3 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Power Platform sub-buttons with hierarchical design */}
          {powerPlatformPaths.includes(pathname) && (
            <div className="relative mt-4 mb-10">
              {/* Connecting line from parent button */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-px h-2 bg-gradient-to-b from-primary-300 to-transparent dark:from-primary-600"></div>
              
              {/* Sub-button container with background grouping */}
              <div className="bg-gray-50/70 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm animate-in slide-in-from-top-2 duration-300 max-w-fit mx-auto">
                <div className="flex flex-wrap gap-2 justify-center sm:flex-nowrap">
                  {[
                    { name: 'Power Apps', icon: '/icons/PowerApps_scalable.svg', href: '/product-news' },
                    { name: 'Power Automate', icon: '/icons/PowerAutomate_scalable.svg', href: '/product-news/power-automate' },
                    { name: 'Copilot Studio', icon: '/icons/CopilotStudio_scalable.svg', href: '/product-news/copilot' },
                    { name: 'Power Platform', icon: '/icons/PowerPlatform_scalable.svg', href: '/product-news/power-platform' },
                  ].map((product, index) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-9 min-w-[130px] max-w-[130px] text-xs w-full sm:w-auto transform hover:scale-105 animate-in fade-in-50 slide-in-from-top-1 duration-200
                        ${pathname === product.href
                          ? 'bg-primary-100 border-primary-400 dark:bg-primary-800/60 dark:border-primary-600 shadow-md ring-1 ring-primary-300 dark:ring-primary-700 text-primary-900 dark:text-primary-100 font-semibold'
                          : 'bg-white/90 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/80 dark:hover:bg-primary-800/30 text-gray-700 dark:text-gray-200'
                        }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="text-primary-500 dark:text-primary-400 text-[10px] mr-1">→</span>
                      <Image src={product.icon} alt={product.name} width={14} height={14} className="w-3.5 h-3.5 object-contain opacity-80" />
                      <span className={`text-xs font-medium ${
                        pathname === product.href
                          ? 'text-primary-900 dark:text-primary-100'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {product.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Azure AI Foundry sub-buttons with hierarchical design */}
          {['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/vscode'].includes(pathname) && (
            <div className="relative mt-4 mb-10">
              {/* Connecting line from parent button */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-px h-2 bg-gradient-to-b from-primary-300 to-transparent dark:from-primary-600"></div>
              
              {/* Sub-button container with background grouping */}
              <div className="bg-gray-50/70 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm animate-in slide-in-from-top-2 duration-300 max-w-fit mx-auto">
                <div className="flex flex-wrap gap-2 justify-center sm:flex-nowrap">
              {[
                 { name: 'Azure AI Foundry', icon: 'https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png', href: '/product-news/azure-ai-foundry' },
                 { name: 'All Things Azure', icon: '/icons/Azure.svg', href: '/product-news/all-things-azure' },
                 { name: 'Semantic Kernel', icon: '/icons/sklogo.svg', href: '/product-news/semantic-kernel' },
                     { name: 'VS Code', icon: '/icons/azure/devops/VisualStudioCode.svg', href: '/product-news/vscode' },
                  ].map((product, index) => (
                <Link
                  key={product.name}
                  href={product.href}
                      className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-9 min-w-[130px] max-w-[130px] text-xs w-full sm:w-auto transform hover:scale-105 animate-in fade-in-50 slide-in-from-top-1 duration-200
                    ${pathname === product.href
                          ? 'bg-primary-100 border-primary-400 dark:bg-primary-800/60 dark:border-primary-600 shadow-md ring-1 ring-primary-300 dark:ring-primary-700 text-primary-900 dark:text-primary-100 font-semibold'
                          : 'bg-white/90 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/80 dark:hover:bg-primary-800/30 text-gray-700 dark:text-gray-200'
                    }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                >
                      <span className="text-primary-500 dark:text-primary-400 text-[10px] mr-1">→</span>
                      <Image src={product.icon} alt={product.name} width={14} height={14} className="w-3.5 h-3.5 object-contain opacity-80" />
                  <span className={`text-xs font-medium ${
                    pathname === product.href
                          ? 'text-primary-900 dark:text-primary-100'
                          : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {product.name}
                  </span>
                </Link>
              ))}
                </div>
              </div>
            </div>
          )}

          {/* Fabric/Power BI sub-buttons with hierarchical design */}
          {['/product-news/fabric-blog','/product-news/power-bi'].includes(pathname) && (
            <div className="relative mt-4 mb-10">
              {/* Connecting line from parent button */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-px h-2 bg-gradient-to-b from-primary-300 to-transparent dark:from-primary-600"></div>
              
              {/* Sub-button container with background grouping */}
              <div className="bg-gray-50/70 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm animate-in slide-in-from-top-2 duration-300 max-w-fit mx-auto">
                <div className="flex gap-2 justify-center">
              {[
                { name: 'Fabric', icon: '/icons/fabric_48_color.svg', href: '/product-news/fabric-blog' },
                { name: 'Power BI', icon: '/icons/PowerBI_scalable.svg', href: '/product-news/power-bi' },
                  ].map((product, index) => (
                <Link
                  key={product.name}
                  href={product.href}
                      className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-9 min-w-[130px] max-w-[130px] text-xs transform hover:scale-105 animate-in fade-in-50 slide-in-from-top-1 duration-200
                    ${pathname === product.href
                          ? 'bg-primary-100 border-primary-400 dark:bg-primary-800/60 dark:border-primary-600 shadow-md ring-1 ring-primary-300 dark:ring-primary-700 text-primary-900 dark:text-primary-100 font-semibold'
                          : 'bg-white/90 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/80 dark:hover:bg-primary-800/30 text-gray-700 dark:text-gray-200'
                    }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                >
                      <span className="text-primary-500 dark:text-primary-400 text-[10px] mr-1">→</span>
                      <Image src={product.icon} alt={product.name} width={14} height={14} className="w-3.5 h-3.5 object-contain opacity-80" />
                  <span className={`text-xs font-medium ${
                    pathname === product.href
                          ? 'text-primary-900 dark:text-primary-100'
                          : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {product.name}
                  </span>
                </Link>
              ))}
                </div>
              </div>
            </div>
          )}

          {(pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')) && <AuthorButtons />}

          {children}
        </div>
      </div>
    </div>
  )
}