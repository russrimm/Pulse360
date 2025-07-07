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
  const [authorTitle, setAuthorTitle] = useState<string | null>(null)
  const [authorName, setAuthorName] = useState<string | null>(null)

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
          author: authorName || slugToName(slug),
          categories: Array.from(item.querySelectorAll('category')).map(cat => cat.textContent || ''),
        }))
        // Filter to only posts from the past 12 months
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
        const filteredPosts = posts.filter(p => new Date(p.publishDate) >= twelveMonthsAgo)
        setNews(filteredPosts)
      } catch (err) {
        setError('Failed to load author posts.')
      } finally {
        setLoading(false)
      }
    }
    fetchAuthorFeed()
  }, [slug, authorName])

  useEffect(() => {
    if (!slug) return
    async function fetchTitle() {
      try {
        const res = await fetch('/api/microsoft-news-authors')
        const authors = await res.json()
        const authorObj = authors.find((a: any) => a.slug === slug)
        setAuthorTitle(authorObj?.title || null)
        setAuthorName(authorObj?.name || null)
      } catch {}
    }
    fetchTitle()
  }, [slug])

  const titleText = authorTitle ? `Posts by ${authorName || slugToName(slug || '')} - ${authorTitle}` : `Posts by ${authorName || slugToName(slug || '')}`

  return (
    <ProductNewsLayout
      title={<span className="text-sm md:text-base font-semibold whitespace-nowrap">{titleText}</span>}
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