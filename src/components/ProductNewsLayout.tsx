'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductNewsLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  icon: string;
}

let products = [
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
  },
  {
    name: 'Microsoft Learn',
    icon: '/icons/m365.svg',
    href: '/product-news/learn-blog',
  },
  {
    name: 'Microsoft News',
    icon: '/icons/Windows.svg',
    href: '/product-news/microsoft-news',
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
    name: 'Development',
    icon: '/icons/azure/devops/10261-icon-service-Azure-DevOps.svg',
    href: '/product-news/azure-ai-foundry',
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

// Fetch author title from their blog page
function useAuthorTitle(author: string) {
  const [title, setTitle] = useState<string | null>(null)
  useEffect(() => {
    if (!author) return
    const slug = getAuthorSlug(author)
    if (!slug) return
    const url = `https://blogs.microsoft.com/blog/author/${slug}/`
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const match = html.match(/<title>(.*?)<\/title>/i)
        if (match && match[1]) {
          // Remove 'Author: ' and keep only the part after the name
          const parts = match[1].split('|')
          if (parts.length > 1) setTitle(parts[0].replace(/^Author: [^-]+- /, '').trim())
          else setTitle(null)
        }
      })
      .catch(() => setTitle(null))
  }, [author])
  return title
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
  return (
    <Link
      href={`/product-news/author/${slug}`}
      className={`flex flex-col items-center justify-center gap-0 px-2 py-1 rounded-lg border transition-all duration-200 h-auto min-h-[56px] text-xs whitespace-normal sm:w-[260px] w-full
        ${isSelected
          ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800 text-primary-800 dark:text-primary-200 font-semibold'
          : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-white'}
      `}
    >
      <span className="w-full text-center font-medium leading-tight block">{decodeHtmlEntities(author)}</span>
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src={icon}
              alt={typeof title === 'string' ? title : ''}
              width={32}
              height={32}
              className="w-8 h-8"
            />
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

        <div className="mt-4 mb-2 w-full overflow-x-hidden">
          {/* Mobile: show all buttons in a single grid */}
          <div className={`grid grid-cols-2 gap-3 w-full min-w-0 lg:hidden justify-center${!['/product-news/power-platform','/product-news/power-automate','/product-news/copilot','/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/fabric-blog','/product-news/power-bi'].includes(pathname) ? ' mb-8' : ''}`}>
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex flex-row items-center justify-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 h-10 w-full
                  ${
                    (product.href === '/product-news/microsoft-news' && (pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')))
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel'].includes(pathname))
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
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
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
          {/* Desktop: force all buttons into a single horizontal row, shrink if needed */}
          <div className={`hidden lg:flex flex-wrap gap-2 w-full pb-1 justify-center${!['/product-news/power-platform','/product-news/power-automate','/product-news/copilot','/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel','/product-news/fabric-blog','/product-news/power-bi'].includes(pathname) ? ' mb-8' : ''}`}>
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] flex-shrink text-xs
                  ${
                    (product.href === '/product-news/microsoft-news' && (pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')))
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : (product.href === '/product-news/azure-ai-foundry' && ['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel'].includes(pathname))
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
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 self-center object-contain ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
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

          {/* Power Platform sub-buttons, only show when Power Platform is selected and not on /product-news */}
          {['/product-news/power-platform','/product-news/power-automate','/product-news/copilot'].includes(pathname) && (
            <div className="flex flex-wrap gap-2 mt-2 mb-4 justify-center sm:flex-nowrap">
              {[
                { name: 'Power Apps', icon: '/icons/PowerApps_scalable.svg', href: '/product-news' },
                { name: 'Power Automate', icon: '/icons/PowerAutomate_scalable.svg', href: '/product-news/power-automate' },
                { name: 'Copilot Studio', icon: '/icons/CopilotStudio_scalable.svg', href: '/product-news/copilot' },
                { name: 'Power Platform', icon: '/icons/PowerPlatform_scalable.svg', href: '/product-news/power-platform' },
              ].map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] text-xs w-full sm:w-auto
                    ${pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                    }`}
                >
                  <Image src={product.icon} alt={product.name} width={16} height={16} className="w-4 h-4 object-contain" />
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
          )}

          {/* Azure AI Foundry sub-buttons, only show when Azure AI Foundry or its subpages are selected */}
          {['/product-news/azure-ai-foundry','/product-news/all-things-azure','/product-news/semantic-kernel'].includes(pathname) && (
            <div className="flex flex-wrap gap-2 mt-2 mb-6 justify-center sm:flex-nowrap">
              {[
                 { name: 'Azure AI Foundry', icon: 'https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png', href: '/product-news/azure-ai-foundry' },
                 { name: 'All Things Azure', icon: '/icons/Azure.svg', href: '/product-news/all-things-azure' },
                 { name: 'Semantic Kernel', icon: '/icons/sklogo.svg', href: '/product-news/semantic-kernel' },
              ].map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] text-xs w-full sm:w-auto
                    ${pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                    }`}
                >
                  <Image src={product.icon} alt={product.name} width={16} height={16} className="w-4 h-4 object-contain" />
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
          )}

          {/* Fabric/Power BI sub-buttons, only show when Fabric or Power BI is selected */}
          {['/product-news/fabric-blog','/product-news/power-bi'].includes(pathname) && (
            <div className="flex gap-2 mt-2 mb-4 justify-center">
              {[
                { name: 'Fabric', icon: '/icons/fabric_48_color.svg', href: '/product-news/fabric-blog' },
                { name: 'Power BI', icon: '/icons/PowerBI_scalable.svg', href: '/product-news/power-bi' },
              ].map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className={`flex items-center justify-center gap-2 px-2 py-1 rounded-lg border transition-all duration-200 h-10 min-w-[140px] max-w-[140px] text-xs
                    ${pathname === product.href
                      ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                      : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                    }`}
                >
                  <Image src={product.icon} alt={product.name} width={16} height={16} className="w-4 h-4 object-contain" />
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
          )}

          {(pathname === '/product-news/microsoft-news' || pathname.startsWith('/product-news/author/')) && <AuthorButtons />}

          {children}
        </div>
      </div>
    </div>
  )
}