import { NextRequest, NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  // Prevent path traversal — only allow alphanumeric and hyphens
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
  }

  try {
    return await proxyMicrosoftFeed(`https://blogs.microsoft.com/blog/author/${slug}/feed/`);
  } catch (error) {
    console.error('Error fetching Microsoft author feed:', error);
    return NextResponse.json({ error: 'Microsoft author feed unavailable' }, { status: 502 });
  }
}
