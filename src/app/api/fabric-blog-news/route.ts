import { NextResponse } from 'next/server'
import { parseStringPromise } from 'xml2js'

const FEED_URL = 'https://blog.fabric.microsoft.com/en-us/blog/feed/'

export async function GET() {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    const xml = await res.text()
    const parsed = await parseStringPromise(xml, { explicitArray: false })
    const items = parsed.rss?.channel?.item || []
    const news = Array.isArray(items) ? items : [items]
    const result = news.map((item: any, i: number) => ({
      id: String(item.guid?._ || item.link || i),
      title: item.title ? String(item.title) : '',
      link: item.link ? String(item.link) : '',
      publishDate: item.pubDate ? String(item.pubDate) : '',
      description: item.description ? String(item.description) : '',
    }))
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to parse feed', details: String(err) }, { status: 500 })
  }
} 