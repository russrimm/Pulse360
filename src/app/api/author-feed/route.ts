import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const url = `https://blogs.microsoft.com/blog/author/${slug}/feed/`
  const res = await fetch(url)
  const xml = await res.text()
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
} 