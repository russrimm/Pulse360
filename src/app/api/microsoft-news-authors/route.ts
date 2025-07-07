import { NextResponse } from 'next/server'

const authorSlugOverrides: Record<string, string> = {
  'Frank X. Shaw': 'frankxshaw',
  'Jared Spataro': 'jspataro',
  'Alysa Taylor': 'ataylor',
  'Paul Nyhan': 'pnyhan',
  'Nicole Dezen': 'ndezen',
  // Add more overrides as needed
}

// Manual title overrides for authors with missing or non-standard titles
const authorTitleOverrides: Record<string, string> = {
  'Paul Nyhan': 'Senior Communications Manager', // Set the correct title if known
  // Add more as needed
}

async function getAuthorTitle(slug: string, name: string): Promise<string> {
  if (authorTitleOverrides[name]) return authorTitleOverrides[name]
  try {
    const url = `https://blogs.microsoft.com/blog/author/${slug}/`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    if (!res.ok) return ''
    const html = await res.text()
    // Try <title> extraction first
    let match = html.match(/<title>Author: [^-]+-\s*([\s\S]*?)\s*\|/i)
    if (match && match[1]) return match[1].trim()
    // Fallback: try <a> tag extraction
    const aMatch = html.match(/<a [^>]*aria-label=\"See more written by [^\"]+\">([^<]+)<\/a>/i)
    if (aMatch && aMatch[1]) {
      const parts = aMatch[1].split(' - ')
      if (parts.length > 1) return parts.slice(1).join(' - ').trim()
    }
    return ''
  } catch (err) {
    // Optionally log for debugging
    // console.error('getAuthorTitle error:', err)
    return ''
  }
}

async function hasRecentPosts(slug: string, name: string): Promise<boolean> {
  try {
    const url = `https://blogs.microsoft.com/blog/author/${slug}/feed/`
    console.log('Fetching feed for', name, slug, url)
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) {
      console.log('Feed not ok for', name, slug, res.status)
      return false
    }
    const xml = await res.text()
    // Use regex to extract all <pubDate>...</pubDate> values
    const pubDates = Array.from(xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)).map(m => m[1])
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    console.log('All pubDates for', name, ':', pubDates)
    const recentDates = pubDates.filter(dateStr => {
      const date = new Date(dateStr)
      const isRecent = date >= twelveMonthsAgo
      console.log('Parsed date for', name, ':', dateStr, '->', date, 'isRecent:', isRecent)
      return isRecent
    })
    const hasRecent = recentDates.length > 0
    console.log('Recent for', name, slug, ':', hasRecent, 'Recent dates:', recentDates)
    return hasRecent
  } catch (err) {
    console.error('Error checking posts for', name, slug, err)
    return false
  }
}

export async function GET() {
  try {
    const response = await fetch('https://blogs.microsoft.com/feed/')
    if (!response.ok) throw new Error('Failed to fetch Microsoft Blog news')
    const xml = await response.text()
    // Use regex to extract all <dc:creator>...</dc:creator> values
    const matches = Array.from(xml.matchAll(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/g))
    const authors = Array.from(new Set(matches.map(m => m[1].trim()).filter(Boolean)))
    // For each author, fetch their title
    let authorObjs = (await Promise.all(authors.map(async name => {
      const slug = authorSlugOverrides[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const title = await getAuthorTitle(slug, name) || ''
      console.log('Checking author:', name, 'slug:', slug)
      const recent = await hasRecentPosts(slug, name)
      console.log('Recent for', name, ':', recent)
      if (!recent) return null
      return { name, title: title as string, slug }
    }))).filter((a): a is { name: string; title: string; slug: string } => !!a)
    // Rename 'Microsoft Corporate Blogs' to 'Microsoft Corporate'
    authorObjs = authorObjs.map(a => a.name === 'Microsoft Corporate Blogs' ? { ...a, name: 'Microsoft Corporate' } : a)
    // Swap 'Microsoft Corporate' and 'Nicole Dezen' if both exist
    const idxCorp = authorObjs.findIndex(a => a.name === 'Microsoft Corporate')
    const idxNicole = authorObjs.findIndex(a => a.name === 'Nicole Dezen')
    if (idxCorp !== -1 && idxNicole !== -1 && idxNicole > idxCorp) {
      const [nicole] = authorObjs.splice(idxNicole, 1)
      authorObjs.splice(idxCorp, 0, nicole)
    }
    return NextResponse.json(authorObjs)
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
} 