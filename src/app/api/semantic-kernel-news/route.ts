import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://devblogs.microsoft.com/semantic-kernel/feed/', {
      next: { revalidate: 3600 }
    })
    if (!response.ok) {
      return new NextResponse('Failed to fetch Semantic Kernel news', { status: 500 })
    }
    const xml = await response.text()
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return new NextResponse('Error fetching Semantic Kernel news', { status: 500 })
  }
} 