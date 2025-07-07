"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductNewsCard } from '@/components/ProductNewsCard'
import { ProductNewsLayout } from '@/components/ProductNewsLayout'

function slugToName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function AuthorNewsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    async function fetchAuthorFeed() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/author-feed?slug=${slug}`)
        const xml = await res.text()
        const parser = new window.DOMParser()
        const doc = parser.parseFromString(xml, 'text/xml')
        const items = doc.querySelectorAll('item')
        const posts = Array.from(items).map(item => ({
          id: item.querySelector('guid')?.textContent,
          title: item.querySelector('title')?.textContent,
          link: item.querySelector('link')?.textContent,
          description: item.querySelector('description')?.textContent,
          publishDate: new Date(item.querySelector('pubDate')?.textContent || '').toISOString(),
          author: slugToName(slug),
          categories: Array.from(item.querySelectorAll('category')).map(cat => cat.textContent || ''),
        }))
        setNews(posts)
      } catch (err) {
        setError('Failed to load author posts.')
      } finally {
        setLoading(false)
      }
    }
    fetchAuthorFeed()
  }, [slug])

  return (
    <ProductNewsLayout
      title={`Posts by ${slugToName(slug || '')}`}
      description={`Latest blog posts by ${slugToName(slug || '')}`}
      icon="/icons/Windows.svg"
    >
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <ProductNewsCard key={item.id} news={item} productIcon="/icons/Windows.svg" />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  )
} 